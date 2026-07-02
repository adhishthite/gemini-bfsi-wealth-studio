"""Cymbal Direct — Style Studio backend (FastAPI).

WebSocket /ws       : control channel — stylist chat (fallback brain) + instant cart actions
WebSocket /ws/live  : real Gemini Live Avatar proxy (audio/video) on the SAME shared session
REST /api/*         : catalog, profile, runtime config
Static              : /assets (generated imagery) + built frontend (dist) in production
"""
from __future__ import annotations
import json, uuid
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from . import config
from .session import CommerceSession, HANDLERS
from .brain import GeminiBrain

app = FastAPI(title="Cymbal Direct — Style Studio")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# one CommerceSession per browser, shared between /ws (control) and /ws/live (avatar)
SESSIONS: dict[str, CommerceSession] = {}


@app.get("/api/config")
def get_config():
    return {"avatar_transport": config.AVATAR_TRANSPORT, "brand": "Cymbal Direct",
            "default_avatar": config.AVATAR_NAME, "live_available": config.live_available()}


@app.get("/api/catalog")
def get_catalog():
    return JSONResponse(CommerceSession().catalog)


@app.get("/api/profile")
def get_profile():
    p = dict(CommerceSession().profile)
    p["payment"] = {"type": p["payment"]["type"], "last4": p["payment"]["last4"]}
    return JSONResponse(p)


@app.websocket("/ws")
async def ws_control(ws: WebSocket):
    await ws.accept()
    sid = uuid.uuid4().hex
    session = CommerceSession()
    SESSIONS[sid] = session

    async def send(msg: dict):
        await ws.send_text(json.dumps(msg))

    session.set_sender(send)
    await send({"type": "init", "session_id": sid, "catalog": session.catalog,
                "profile": {"name": session.profile["name"], "city": session.profile["city"],
                            "base_photo": session.profile["base_photo"],
                            "recommended_sizes": session.profile["recommended_sizes"],
                            "address": session.profile["default_address"],
                            "payment": {"type": session.profile["payment"]["type"],
                                        "last4": session.profile["payment"]["last4"]}},
                "orders": session.orders_view(),
                "default_avatar": config.AVATAR_NAME,
                "live_available": config.live_available()})

    brain = GeminiBrain(session)
    try:
        while True:
            msg = json.loads(await ws.receive_text())
            mtype = msg.get("type")
            if mtype == "user_text" and msg.get("text", "").strip():
                await send({"type": "thinking"})
                try:
                    await brain.run_turn(msg["text"].strip(), send, avatar=msg.get("avatar"))
                except Exception as e:  # noqa — a brain/LLM error must never kill the socket
                    print(f"[ws] brain error: {e!r}")
                    await send({"type": "assistant_text",
                                "text": "Sorry, I hit a snag there — could you say that once more?"})
                    await send({"type": "turn_complete"})
            elif mtype == "set_persona":
                brain.set_persona(msg.get("avatar", ""))  # stylist name/voice only
            elif mtype == "set_gender":
                g = (msg.get("gender") or "all").lower()
                if g in ("women", "men"):
                    session.user_gender, session.gender_locked = g, True   # explicit pick locks it
                else:
                    session.user_gender, session.gender_locked = "all", False  # "All" lets the AI infer
            elif mtype == "action":
                method = HANDLERS.get(msg.get("action", ""))
                if method:
                    try:
                        getattr(session, method)(**{k: v for k, v in msg.items()
                                                    if k not in ("type", "action")})
                    except Exception as e:  # noqa
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
        await ws.send_text(json.dumps({"type": "error",
            "message": "Live Avatar is not configured. Set AVATAR_TRANSPORT=live and an entitled LIVE_PROJECT."}))
        await ws.close()
        return
    session = SESSIONS.get(sid) or CommerceSession()

    async def send(msg: dict):
        await ws.send_text(json.dumps(msg))

    session.set_sender(send)
    try:
        from .live_proxy import run_live
        await run_live(ws, session, send, avatar=avatar)
    except WebSocketDisconnect:
        return
    except Exception as e:  # noqa
        try:
            await send({"type": "error", "message": f"Live Avatar error: {str(e)[:200]}"})
        except Exception:
            pass


# ---- static (mounted last so /api and /ws win) ----
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
