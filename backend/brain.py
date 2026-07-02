"""Fallback conversational brain — standard Gemini (Vertex) chat with function-calling.

Used when AVATAR_TRANSPORT=fallback (the Live API is not entitled in this environment).
Runs a tool-calling loop: model -> function_calls -> execute (mutates session, emits
ui_commands) -> function_responses -> final spoken text.
"""
from __future__ import annotations
import asyncio
from google import genai
from google.genai import types

from . import config, tools
from .session import CommerceSession, HANDLERS


class GeminiBrain:
    def __init__(self, session: CommerceSession):
        self.session = session
        self.client = genai.Client(vertexai=True, project=config.BRAIN_PROJECT,
                                   location=config.BRAIN_LOCATION)
        self.name = config.AVATAR_NAME
        self._build_cfg()
        self.history: list[types.Content] = []

    def _build_cfg(self):
        self.cfg = types.GenerateContentConfig(
            tools=[tools.TOOL],
            temperature=0.6,
            system_instruction=tools.system_instruction(self.session.profile, self.name, self.session.user_gender),
            automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
        )

    def set_persona(self, avatar: str):
        """Switch the stylist persona (name) only — gender is NOT tied to the avatar."""
        if avatar:
            self.name = avatar

    async def to_english(self, text: str) -> str:
        """Normalise a shopper utterance (any language — often Hindi/Hinglish) into one short ENGLISH
        command, so the (English) intent handler can act on it. Gemini handles all languages natively."""
        if not text or not text.strip():
            return text
        prompt = (
            "Convert the shopper's words (any language, often Hindi or Hinglish) into ONE short ENGLISH "
            "command for a fashion shopping app. Preserve the intent (show/browse, add to cart, remove, "
            "complete the look / add matching pieces, try-on, checkout, apply a promo code, place order, give "
            "CVV), plus occasion, product type, colour, gender and any numbers/codes. If they ask to complete/"
            "finish the outfit or add matching items, start the command with 'Complete the look'. Write all "
            "numbers and codes as DIGITS (e.g. 'one two three' -> '123', "
            "'double five' -> '55'). If it's just small talk, return it as-is in English. "
            "Output ONLY the command, nothing else.\n\nShopper: " + text
        )
        try:
            r = await asyncio.to_thread(
                self.client.models.generate_content, model=config.BRAIN_MODEL, contents=prompt,
                config=types.GenerateContentConfig(temperature=0))
            return (r.text or text).strip()
        except Exception:  # noqa
            return text

    async def execute_intent(self, user_text: str, send):
        """LIVE mode: run the (possibly Hindi/Hinglish) transcript through the multilingual tool model
        to EXECUTE actions (filter / cart / checkout / VTO) and emit ui_commands — but DO NOT send any
        spoken text (the Live Avatar handles the conversation). Gemini handles all languages natively."""
        self._build_cfg()
        self.history.append(types.Content(role="user", parts=[types.Part(text=user_text)]))
        for _ in range(4):
            resp = await asyncio.to_thread(
                self.client.models.generate_content,
                model=config.BRAIN_MODEL, contents=self.history, config=self.cfg)
            cand = resp.candidates[0]
            parts = cand.content.parts or []
            self.history.append(cand.content)
            calls = [p.function_call for p in parts if p.function_call]
            if not calls:
                break
            fn_responses = []
            for fc in calls:
                method = HANDLERS.get(fc.name)
                try:
                    result = getattr(self.session, method)(**dict(fc.args or {})) if method \
                        else {"error": f"unknown tool {fc.name}"}
                except Exception as e:  # noqa
                    result = {"error": str(e)[:200]}
                for cmd in self.session.drain():
                    await send(cmd)
                fn_responses.append(types.Part.from_function_response(name=fc.name, response=result))
            self.history.append(types.Content(role="user", parts=fn_responses))

    async def run_turn(self, user_text: str, send, avatar: str | None = None):
        """Run one user turn; `send` is an async fn(dict) to push events to the client."""
        if avatar:
            self.set_persona(avatar)
        self._build_cfg()  # reflect current name + the shopper's current gender each turn
        self.history.append(types.Content(role="user", parts=[types.Part(text=user_text)]))
        for _ in range(6):  # cap tool hops
            resp = await asyncio.to_thread(
                self.client.models.generate_content,
                model=config.BRAIN_MODEL, contents=self.history, config=self.cfg)
            cand = resp.candidates[0]
            parts = cand.content.parts or []
            self.history.append(cand.content)

            calls = [p.function_call for p in parts if p.function_call]
            text = "".join(p.text for p in parts if p.text)
            if text.strip():
                await send({"type": "assistant_text", "text": text.strip()})

            if not calls:
                break

            # execute each tool call, flush ui_commands, feed results back
            fn_responses = []
            for fc in calls:
                method = HANDLERS.get(fc.name)
                try:
                    result = getattr(self.session, method)(**dict(fc.args or {})) if method \
                        else {"error": f"unknown tool {fc.name}"}
                except Exception as e:  # noqa
                    result = {"error": str(e)[:200]}
                for cmd in self.session.drain():
                    await send(cmd)
                fn_responses.append(types.Part.from_function_response(name=fc.name, response=result))
            self.history.append(types.Content(role="user", parts=fn_responses))
        await send({"type": "turn_complete"})
