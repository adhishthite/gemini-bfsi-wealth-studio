"""Real Gemini 3.1 Live Avatar — raw Vertex BidiGenerateContent WebSocket proxy.

Faithfully follows the proven reference (live-av/app.py): connect to the Vertex
LlmBidiService WS with an ADC bearer token, send a `setup` with VIDEO modality +
avatar_config + our catalog tools, then pipe messages both ways. Unlike the generic
reference, tool calls are executed SERVER-SIDE against the shared CommerceSession so
the avatar drives the same catalog/cart/checkout UI as the rest of the app.

Transport: fragmented-MP4 video + PCM audio + transcription stream back as JSON;
the browser plays them via MSE / WebAudio (see frontend/src/lib/liveClient.ts).

Requires AVATAR_TRANSPORT=live and an ENTITLED LIVE_PROJECT (the model is allowlist-
gated Private Preview). See plan.md / README.
"""
from __future__ import annotations
import asyncio, json, ssl
import certifi
import google.auth
import google.auth.transport.requests
import websockets

from . import config, tools
from .session import CommerceSession, HANDLERS

_ssl = ssl.create_default_context(cafile=certifi.where())
_creds, _ = google.auth.default()


def _token() -> str:
    _creds.refresh(google.auth.transport.requests.Request())
    return _creds.token


def _uri() -> str:
    # Vertex global endpoint has NO region prefix; regional endpoints do (e.g. us-central1-…).
    loc = config.LIVE_LOCATION
    host = "aiplatform.googleapis.com" if loc in ("", "global") else f"{loc}-aiplatform.googleapis.com"
    return f"wss://{host}/ws/google.cloud.aiplatform.v1.LlmBidiService/BidiGenerateContent"


def _raw_tools() -> list[dict]:
    decls = [fd.model_dump(by_alias=True, exclude_none=True, mode="json")
             for fd in tools.FUNCTION_DECLARATIONS]
    return [{"functionDeclarations": decls}]


ALLOWED_AVATARS = {"Kira", "Ingrid", "Vera", "Jay", "Paul", "Sam",
                   "Kai", "Ben", "Leo", "Carmen", "Piper"}
# fitting prebuilt voice per avatar (female: Aoede/Kore/Leda; male: Charon/Fenrir/Puck)
VOICE_BY_AVATAR = {
    "Kira": "Aoede", "Ingrid": "Kore", "Vera": "Aoede", "Carmen": "Kore", "Piper": "Aoede",
    "Jay": "Charon", "Paul": "Fenrir", "Sam": "Puck", "Kai": "Puck", "Ben": "Charon", "Leo": "Fenrir",
}


def _setup_msg(session: CommerceSession, avatar: str = "") -> dict:
    avatar_name = avatar if avatar in ALLOWED_AVATARS else config.AVATAR_NAME
    voice = VOICE_BY_AVATAR.get(avatar_name, config.AVATAR_VOICE)  # voice follows the avatar (its gender)
    # shopper gender stays dynamic (session.user_gender) — NOT tied to the avatar
    sysi = tools.system_instruction(session.profile, avatar_name, session.user_gender, live=True)
    model = (f"projects/{config.LIVE_PROJECT}/locations/{config.LIVE_LOCATION}"
             f"/publishers/google/models/{config.LIVE_MODEL}")
    return {"setup": {
        "model": model,
        "systemInstruction": {"parts": [{"text": sysi}]},
        "generationConfig": {
            "responseModalities": ["VIDEO"],
            "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}},
        },
        "avatarConfig": {"avatar_name": avatar_name},
        # NOTE: no `tools` — the Live Avatar model does not resume speaking after a mid-conversation
        # function call (preview limitation), so we drive the catalog from the shopper's transcript instead.
        "outputAudioTranscription": {},   # avatar's speech → transcript
        "inputAudioTranscription": {},    # shopper's speech → transcript (drives catalog + full transcript)
        # Push-to-talk: disable server VAD; the client sends explicit activityStart (on press) and
        # activityEnd (on release), streaming mic audio in between. Reliable per-turn replies.
        "realtimeInputConfig": {"automaticActivityDetection": {"disabled": True}},
    }}


async def run_live(browser_ws, session: CommerceSession, send, avatar: str = ""):
    """Bridge browser <-> Gemini Live Avatar on a shared CommerceSession.
    `send(dict)` pushes JSON to the browser; raw gemini frames are forwarded verbatim."""
    from .brain import GeminiBrain
    # Seed the shopper's default gender from the chosen avatar so the intent model FILTERS immediately
    # (instead of asking "men's or women's?" — which is discarded in live). Voice can still switch it.
    avatar_name = avatar if avatar in ALLOWED_AVATARS else config.AVATAR_NAME
    # The shopper is our male customer (Arjun); the stylist avatar's gender is irrelevant to the catalog.
    # Default to men's wear — he can ask for women's (a gift) any time.
    session.user_gender = "men"
    brain = GeminiBrain(session)   # multilingual (Hindi/Hinglish/English) intent → actions, via gemini-2.5-flash + tools
    headers = {"Authorization": f"Bearer {_token()}"}
    print(f"[live] starting session avatar={avatar or config.AVATAR_NAME} project={config.LIVE_PROJECT}")
    async with websockets.connect(_uri(), additional_headers=headers, ssl=_ssl,
                                  max_size=None, ping_interval=20, ping_timeout=60) as gem:
        await gem.send(json.dumps(_setup_msg(session, avatar)))
        setup_ack = await gem.recv()
        print(f"[live] setup ack: {str(setup_ack)[:160]}")
        await send({"type": "ready"})

        async def browser_to_gemini():
            audio_chunks = 0
            try:
                while True:
                    raw = await browser_ws.receive_text()
                    msg = json.loads(raw)
                    if msg.get("type") == "action":  # manual cart/sizing/checkout while live
                        method = HANDLERS.get(msg.get("action", ""))
                        if method:
                            try:
                                getattr(session, method)(**{k: v for k, v in msg.items()
                                                            if k not in ("type", "action")})
                            except Exception as e:  # noqa
                                await send({"type": "error", "message": str(e)[:160]})
                            for cmd in session.drain():
                                await send(cmd)
                    else:
                        ri = msg.get("realtimeInput", {})
                        if "activityStart" in ri:
                            audio_chunks = 0; print("[live] → activityStart (user pressed talk)")
                        elif "activityEnd" in ri:
                            print(f"[live] → activityEnd (sent {audio_chunks} audio chunks)")
                        elif ri.get("mediaChunks"):
                            audio_chunks += 1
                        elif ri.get("text"):
                            print(f"[live] → text: {ri['text'][:60]}")
                        await gem.send(raw)  # realtimeInput (audio/text/activity) → Gemini
            except WebSocketDisconnect:
                print("[live] browser disconnected")
            except Exception as e:  # noqa
                print(f"[live] browser->gemini error: {e!r}")

        async def gemini_to_browser():
            input_buf = ""        # shopper's speech this turn (drives the catalog/cart/checkout)
            try:
                async for raw in gem:
                    text = raw if isinstance(raw, str) else raw.decode()
                    msg = json.loads(text)
                    tc = msg.get("toolCall")
                    if tc and tc.get("functionCalls"):
                        print(f"[live] ⚙ toolCall RAW: {json.dumps(tc)[:400]}")
                        responses = []
                        for fc in tc["functionCalls"]:
                            name = fc.get("name", "")
                            method = HANDLERS.get(name)
                            try:
                                result = getattr(session, method)(**(fc.get("args") or {})) \
                                    if method else {"error": f"unknown tool {name}"}
                            except Exception as e:  # noqa
                                result = {"error": str(e)[:200]}
                            for cmd in session.drain():
                                await send(cmd)
                            # response = the function's return object directly (SDK convention)
                            resp = {"name": name, "response": result if isinstance(result, dict) else {"result": result}}
                            if fc.get("id"):
                                resp["id"] = fc["id"]
                            responses.append(resp)
                        payload = {"toolResponse": {"functionResponses": responses}}
                        print(f"[live] ⚙ sending toolResponse: {json.dumps(payload)[:200]}")
                        await gem.send(json.dumps(payload))
                        continue
                    # Drive every action from the shopper's speech (no tools in live mode).
                    # Accumulate the input transcription, then act ONCE at turnComplete — by then the
                    # FULL utterance is transcribed (acting earlier caught only partial speech, so the
                    # occasion word was missing and the catalog fell back to the default home view).
                    sc = msg.get("serverContent", {})
                    itx = (sc.get("inputTranscription") or {}).get("text")
                    if itx:
                        input_buf += itx
                    if sc.get("turnComplete"):
                        heard = input_buf.strip()
                        input_buf = ""
                        if heard:
                            print(f"[live] 🗣 heard: {heard[:120]!r}")
                            try:
                                english = await brain.to_english(heard)   # Hindi/Hinglish → English
                                act = session.handle_speech(english)      # robust English intent handler
                                print(f"[live] 🌐 {english[:90]!r} → action: {act}")
                                for cmd in session.drain():
                                    await send(cmd)
                            except Exception as e:  # noqa
                                print(f"[live] intent error: {e!r}")
                    extra = [k for k in sc.keys() if k != "modelTurn"]
                    if extra:
                        print(f"[live] serverContent: {extra}")
                    # forward the frame to the browser RAW (no re-serialize — video stream is heavy)
                    await browser_ws.send_text(text)
            except websockets.exceptions.ConnectionClosed as e:
                print(f"[live] GEMINI WS CLOSED code={e.code} reason={e.reason!r}")
                try:
                    await send({"type": "error",
                                "message": f"Live session closed by server (code {e.code}: {e.reason or 'no reason'})"})
                except Exception:
                    pass
            except Exception as e:  # noqa
                print(f"[live] gemini->browser error: {e!r}")

        await asyncio.gather(browser_to_gemini(), gemini_to_browser(), return_exceptions=True)
