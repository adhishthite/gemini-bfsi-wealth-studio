"""Cymbal Premier Wealth Studio backend (FastAPI).

WebSocket /ws       : control channel — wealth advisor chat (brain) + instant basket/simulation actions
WebSocket /ws/live  : real Gemini Live Avatar proxy (audio/video) on the SAME shared session
REST /api/*         : funds, profile, runtime config, proposals
Static              : /assets (visuals/PDFs) + built frontend (dist) in production
"""

from __future__ import annotations
import json, uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from . import config, tts, stt
from .session import WealthSession, HANDLERS
from .brain import GeminiBrain


@asynccontextmanager
async def lifespan(app: FastAPI):
    config.log_startup_config()
    yield


app = FastAPI(title="Cymbal Premier — Wealth Studio", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)

# One WealthSession per browser, shared between /ws (control) and /ws/live (avatar)
SESSIONS: dict[str, WealthSession] = {}


@app.get("/api/config")
def get_config():
    return {
        "avatar_transport": config.AVATAR_TRANSPORT,
        "brand": "Cymbal Premier Wealth Studio",
        "default_avatar": config.AVATAR_NAME or "Ananya",
        "live_available": config.live_available(),
        "tts_voice": config.FALLBACK_TTS_VOICE,
    }


@app.get("/api/funds")
@app.get("/api/catalog")
def get_funds():
    return JSONResponse(WealthSession().funds)


@app.get("/api/profiles")
def get_profiles():
    s = WealthSession()
    return JSONResponse(
        {
            k: {
                "key": k,
                "user_id": p.get("user_id"),
                "name": p.get("name"),
                "occupation": p.get("occupation"),
                "city": p.get("city"),
                "age": p.get("age"),
                "risk_profile": p.get("risk_profile"),
                "investment_style": p.get("investment_style"),
                "total_aum_inr": p.get("total_aum_inr"),
                "monthly_surplus_inr": p.get("monthly_surplus_inr"),
                "active_sip_inr": p.get("active_sip_inr"),
            }
            for k, p in s.profiles.items()
        }
    )


@app.get("/api/profile")
def get_profile(key: str = None):
    s = WealthSession()
    if key:
        k = s.resolve_profile_key(key)
        return JSONResponse(s.profiles[k])
    return JSONResponse(s.profile)


@app.get("/api/tts")
@app.post("/api/tts")
async def get_tts(text: str = "", avatar: str = "Ananya"):
    audio = await tts.synthesize_speech(text, avatar=avatar)
    if not audio:
        return JSONResponse({"detail": "Synthesis failed"}, status_code=500)
    return JSONResponse({"audio": audio})


@app.post("/api/stt")
async def post_stt(request: Request):
    """Transcribe client voice audio bytes to text using Gemini multimodal on Vertex."""
    audio_bytes = await request.body()
    content_type = request.headers.get("content-type", "audio/webm")
    text = await stt.transcribe_audio(audio_bytes, mime_type=content_type)
    return JSONResponse({"text": text})


@app.get("/api/proposals/{proposal_id}.pdf")
def get_proposal_pdf(proposal_id: str):
    pdf_file = config.ASSETS_DIR / "proposals" / f"{proposal_id}.pdf"
    if pdf_file.exists():
        return FileResponse(
            pdf_file, media_type="application/pdf", filename=f"{proposal_id}.pdf"
        )
    return JSONResponse({"detail": "Proposal PDF not found"}, status_code=404)


@app.websocket("/ws")
async def ws_control(ws: WebSocket):
    await ws.accept()
    sid = uuid.uuid4().hex
    session = WealthSession()
    SESSIONS[sid] = session

    async def send(msg: dict):
        await ws.send_text(json.dumps(msg))

    session.set_sender(send)
    await send(
        {
            "type": "init",
            "session_id": sid,
            "funds": session.funds,
            "catalog": session.funds,  # backwards-compatible
            "profile": session.profile,
            "portfolio": session.portfolio,
            "active_profile_key": session.active_profile_key,
            "profiles": session.profiles,
            "basket": session.basket,
            "default_avatar": config.AVATAR_NAME or "Ananya",
            "live_available": config.live_available(),
            "tts_voice": config.FALLBACK_TTS_VOICE,
        }
    )

    brain = GeminiBrain(session)
    active_avatar = config.AVATAR_NAME or "Ananya"
    try:
        while True:
            msg = json.loads(await ws.receive_text())
            mtype = msg.get("type")
            if mtype == "user_text" and msg.get("text", "").strip():
                await send({"type": "thinking"})

                async def on_step(evt: dict):
                    await send(evt)

                async def on_chunk(chunk: str):
                    await send({"type": "stream_chunk", "chunk": chunk})

                try:
                    result = await brain.chat(
                        msg["text"].strip(),
                        on_step=on_step,
                        on_chunk=on_chunk,
                    )
                    for cmd in result.get("ui_commands", []):
                        await send(cmd)
                    if result.get("text"):
                        persona = msg.get("avatar") or active_avatar
                        audio_b64 = await tts.synthesize_speech(
                            result["text"], avatar=persona
                        )
                        payload = {"type": "assistant_text", "text": result["text"]}
                        if audio_b64:
                            payload["audio"] = audio_b64
                        await send(payload)
                    await send({"type": "turn_complete"})
                except Exception as e:
                    print(f"[ws] brain error: {e!r}")
                    await send(
                        {
                            "type": "assistant_text",
                            "text": "I encountered a minor system sync issue. Could you please repeat that?",
                        }
                    )
                    await send({"type": "turn_complete"})
            elif mtype == "set_persona":
                active_avatar = msg.get("avatar", active_avatar)
                brain.set_persona(active_avatar)
            elif mtype == "switch_profile":
                pkey = msg.get("profile_key") or msg.get("key")
                res = session.switch_profile(pkey)
                brain.refresh_profile()
                await send(
                    {
                        "type": "profile_switched",
                        "profile_key": session.active_profile_key,
                        "profile": session.profile,
                        "portfolio": session.portfolio,
                        "basket": session.basket,
                    }
                )
                for cmd in session.drain():
                    await send(cmd)
            elif mtype == "action":
                action_name = msg.get("action", "")
                handler = HANDLERS.get(action_name)
                if handler:
                    try:
                        args = {
                            k: v for k, v in msg.items() if k not in ("type", "action")
                        }
                        handler(session, **args)
                        if action_name in (
                            "switch_client_profile",
                            "switch_profile",
                        ):
                            brain.refresh_profile()
                    except Exception as e:
                        await send({"type": "error", "message": str(e)[:160]})
                    for cmd in session.drain():
                        await send(cmd)
    except WebSocketDisconnect:
        return
    finally:
        SESSIONS.pop(sid, None)


@app.websocket("/ws/live")
async def ws_live(ws: WebSocket, sid: str = "", avatar: str = ""):
    await ws.accept()
    if not config.live_available():
        await ws.send_text(
            json.dumps(
                {
                    "type": "error",
                    "message": "Live Avatar is not configured. Set AVATAR_TRANSPORT=live and an entitled LIVE_PROJECT.",
                }
            )
        )
        await ws.close()
        return
    session = SESSIONS.get(sid) or WealthSession()

    async def send(msg: dict):
        await ws.send_text(json.dumps(msg))

    session.set_sender(send)
    try:
        from .live_proxy import run_live

        await run_live(ws, session, send, avatar=avatar)
    except WebSocketDisconnect:
        return
    except Exception as e:
        try:
            await send(
                {"type": "error", "message": f"Live Avatar error: {str(e)[:200]}"}
            )
        except Exception:
            pass


# Mount static assets
if config.ASSETS_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(config.ASSETS_DIR)), name="assets")

if config.FRONTEND_DIST.exists():
    app.mount(
        "/", StaticFiles(directory=str(config.FRONTEND_DIST), html=True), name="spa"
    )

    @app.exception_handler(404)
    async def spa_fallback(request, exc):
        index = config.FRONTEND_DIST / "index.html"
        if index.exists():
            return FileResponse(index)
        return JSONResponse({"detail": "not found"}, status_code=404)
