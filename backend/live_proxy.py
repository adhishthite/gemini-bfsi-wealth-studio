"""Real Gemini 3.1 Live Avatar — raw Vertex BidiGenerateContent WebSocket proxy.

Connects to Vertex LlmBidiService WS with an ADC bearer token, sends a `setup`
with VIDEO modality + avatar_config + our wealth tools, then pipes messages both ways.
Tool calls are executed SERVER-SIDE against the shared WealthSession so the avatar drives
the same Product Explorer / Portfolio Simulation / Advisory Basket UI.
"""
from __future__ import annotations
import asyncio, json, ssl
import certifi
import google.auth
import google.auth.transport.requests
import websockets

from . import config, tools
from .session import WealthSession, HANDLERS

_ssl = ssl.create_default_context(cafile=certifi.where())
_creds, _ = google.auth.default()


def _token() -> str:
    _creds.refresh(google.auth.transport.requests.Request())
    return _creds.token


def _uri() -> str:
    loc = config.LIVE_LOCATION
    host = "aiplatform.googleapis.com" if loc in ("", "global") else f"{loc}-aiplatform.googleapis.com"
    return f"wss://{host}/ws/google.cloud.aiplatform.v1.LlmBidiService/BidiGenerateContent"


def _raw_tools() -> list[dict]:
    decls = [fd.model_dump(by_alias=True, exclude_none=True, mode="json")
             for fd in tools.FUNCTION_DECLARATIONS]
    return [{"functionDeclarations": decls}]


ALLOWED_AVATARS = {"Ananya", "Kira", "Ingrid", "Vera", "Jay", "Paul", "Sam",
                   "Kai", "Ben", "Leo", "Carmen", "Piper"}

VOICE_BY_AVATAR = {
    "Ananya": "Aoede", "Kira": "Aoede", "Ingrid": "Kore", "Vera": "Aoede", "Carmen": "Kore", "Piper": "Aoede",
    "Jay": "Charon", "Paul": "Fenrir", "Sam": "Puck", "Kai": "Puck", "Ben": "Charon", "Leo": "Fenrir",
}


def _setup_msg(session: WealthSession, avatar: str = "") -> dict:
    avatar_name = avatar if avatar in ALLOWED_AVATARS else (config.AVATAR_NAME or "Ananya")
    voice = VOICE_BY_AVATAR.get(avatar_name, config.AVATAR_VOICE or "Aoede")
    sysi = tools.system_instruction(session.profile, avatar_name, live=True)
    model = (f"projects/{config.LIVE_PROJECT}/locations/{config.LIVE_LOCATION}"
             f"/publishers/google/models/{config.LIVE_MODEL}")
    return {"setup": {
        "model": model,
        "systemInstruction": {"parts": [{"text": sysi}]},
        "generationConfig": {
            "responseModalities": ["VIDEO"],
            "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}},
        },
        "avatarConfig": {"avatar_name": "Kira" if avatar_name == "Ananya" else avatar_name},
        "outputAudioTranscription": {},   # avatar's speech → transcript
        "inputAudioTranscription": {},    # client's speech → transcript
        "realtimeInputConfig": {"automaticActivityDetection": {"disabled": True}},
    }}


async def run_live(browser_ws, session: WealthSession, send, avatar: str = ""):
    """Bridge browser <-> Gemini Live Avatar on a shared WealthSession."""
    from .brain import GeminiBrain
    brain = GeminiBrain(session)
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
                    if msg.get("type") == "action":  # manual basket/simulation action while live
                        action_name = msg.get("action", "")
                        handler = HANDLERS.get(action_name)
                        if handler:
                            try:
                                args = {k: v for k, v in msg.items() if k not in ("type", "action")}
                                handler(session, **args)
                            except Exception as e:
                                await send({"type": "error", "message": str(e)[:160]})
                            for cmd in session.drain():
                                await send(cmd)
                    else:
                        ri = msg.get("realtimeInput", {})
                        if "activityStart" in ri:
                            audio_chunks = 0
                            print("[live] → activityStart (user pressed talk)")
                        elif "activityEnd" in ri:
                            print(f"[live] → activityEnd (sent {audio_chunks} audio chunks)")
                        elif ri.get("mediaChunks"):
                            audio_chunks += 1
                        elif ri.get("text"):
                            print(f"[live] → text: {ri['text'][:60]}")
                        await gem.send(raw)
            except Exception as e:
                print(f"[live] browser->gemini error: {e!r}")

        async def gemini_to_browser():
            input_buf = ""
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
                            handler = HANDLERS.get(name)
                            try:
                                result = handler(session, **(fc.get("args") or {})) if handler else {"error": f"unknown tool {name}"}
                            except Exception as e:
                                result = {"error": str(e)[:200]}
                            for cmd in session.drain():
                                await send(cmd)
                            resp = {"name": name, "response": result if isinstance(result, dict) else {"result": result}}
                            if fc.get("id"):
                                resp["id"] = fc["id"]
                            responses.append(resp)
                        payload = {"toolResponse": {"functionResponses": responses}}
                        await gem.send(json.dumps(payload))
                        continue

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
                                english = await brain.to_english(heard)
                                print(f"[live] 🌐 normalized intent: {english[:90]!r}")
                            except Exception as e:
                                print(f"[live] intent error: {e!r}")

                    await browser_ws.send_text(text)
            except Exception as e:
                print(f"[live] gemini->browser error: {e!r}")

        await asyncio.gather(browser_to_gemini(), gemini_to_browser(), return_exceptions=True)
