"""Cymbal Premier Wealth Studio backend (FastAPI).

WebSocket /ws       : control channel — wealth advisor chat (brain) + instant basket/simulation actions
WebSocket /ws/live  : real Gemini Live Avatar proxy (audio/video) on the SAME shared session
REST /api/*         : funds, profile, runtime config, proposals
Static              : /assets (visuals/PDFs) + built frontend (dist) in production
"""
from __future__ import annotations
import json, uuid
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from . import config
from .session import WealthSession, HANDLERS
from .brain import GeminiBrain

app = FastAPI(title="Cymbal Premier — Wealth Studio")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# One WealthSession per browser, shared between /ws (control) and /ws/live (avatar)
SESSIONS: dict[str, WealthSession] = {}


@app.get("/api/config")
def get_config():
    return {
        "avatar_transport": config.AVATAR_TRANSPORT,
        "brand": "Cymbal Premier Wealth Studio",
        "default_avatar": config.AVATAR_NAME or "Ananya",
        "live_available": config.live_available()
    }


@app.get("/api/funds")
@app.get("/api/catalog")
def get_funds():
    return JSONResponse(WealthSession().funds)


@app.get("/api/profile")
def get_profile():
    p = dict(WealthSession().profile)
    return JSONResponse(p)


@app.get("/api/proposals/{proposal_id}.pdf")
def get_proposal_pdf(proposal_id: str):
    pdf_file = config.ASSETS_DIR / "proposals" / f"{proposal_id}.pdf"
    if pdf_file.exists():
        return FileResponse(pdf_file, media_type="application/pdf", filename=f"{proposal_id}.pdf")
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
    await send({
        "type": "init",
        "session_id": sid,
        "funds": session.funds,
        "catalog": session.funds,  # backwards-compatible
        "profile": session.profile,
        "portfolio": session.portfolio,
        "basket": session.basket,
        "default_avatar": config.AVATAR_NAME or "Ananya",
        "live_available": config.live_available()
    })

    brain = GeminiBrain(session)
    try:
        while True:
            msg = json.loads(await ws.receive_text())
            mtype = msg.get("type")
            if mtype == "user_text" and msg.get("text", "").strip():
                await send({"type": "thinking"})
                try:
                    result = await brain.chat(msg["text"].strip())
                    for cmd in result.get("ui_commands", []):
                        await send(cmd)
                    if result.get("text"):
                        await send({"type": "assistant_text", "text": result["text"]})
                    await send({"type": "turn_complete"})
                except Exception as e:
                    print(f"[ws] brain error: {e!r}")
                    await send({
                        "type": "assistant_text",
                        "text": "I encountered a minor system sync issue. Could you please repeat that?"
                    })
                    await send({"type": "turn_complete"})
            elif mtype == "set_persona":
                brain.set_persona(msg.get("avatar", ""))
            elif mtype == "action":
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
    except WebSocketDisconnect:
        return
    finally:
        SESSIONS.pop(sid, None)


@app.websocket("/ws/live")
async def ws_live(ws: WebSocket, sid: str = "", avatar: str = ""):
    await ws.accept()
    if not config.live_available():
        await ws.send_text(json.dumps({
            "type": "error",
            "message": "Live Avatar is not configured. Set AVATAR_TRANSPORT=live and an entitled LIVE_PROJECT."
        }))
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
            await send({"type": "error", "message": f"Live Avatar error: {str(e)[:200]}"})
        except Exception:
            pass


# Mount static assets
if config.ASSETS_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(config.ASSETS_DIR)), name="assets")

if config.FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(config.FRONTEND_DIST), html=True), name="spa")

    @app.exception_handler(404)
    async def spa_fallback(request, exc):
        index = config.FRONTEND_DIST / "index.html"
        if index.exists():
            return FileResponse(index)
        return JSONResponse({"detail": "not found"}, status_code=404)
