"""Conversational brain — standard Gemini (Vertex) chat with function-calling.

Used when AVATAR_TRANSPORT=fallback (the Live API is not entitled in this environment).
Runs a tool-calling loop: model -> function_calls -> execute (mutates session, emits
ui_commands) -> function_responses -> final spoken text.
"""
from __future__ import annotations
import asyncio
from google import genai
from google.genai import types

from . import config, tools
from .session import WealthSession, HANDLERS


class GeminiBrain:
    def __init__(self, session: WealthSession):
        self.session = session
        self.client = genai.Client(vertexai=True, project=config.BRAIN_PROJECT,
                                   location=config.BRAIN_LOCATION)
        self.name = config.AVATAR_NAME or "Ananya"
        self._build_cfg()
        self.history: list[types.Content] = []

    def _build_cfg(self):
        self.cfg = types.GenerateContentConfig(
            tools=[tools.TOOL],
            temperature=0.6,
            system_instruction=tools.system_instruction(self.session.profile, self.name),
            automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
        )

    def set_persona(self, avatar: str):
        if avatar:
            self.name = avatar
            self._build_cfg()

    async def to_english(self, text: str) -> str:
        """Normalise a client utterance (any language — often Hindi/Hinglish) into one short ENGLISH
        command for the wealth intent handler."""
        if not text or not text.strip():
            return text
        prompt = (
            "Convert the client's spoken words (any language, often Hindi, Marathi, or Hinglish) into ONE short ENGLISH "
            "financial intent statement for a wealth advisory app. Preserve the intent (portfolio review, filter/browse funds, "
            "simulate returns, add/remove to basket, generate proposal, authorize mandate, provide OTP), plus asset category, "
            "fund names, percentages, and financial figures (Lakhs, Crores, SIP amounts). Write all numbers as digits "
            "(e.g. 'one lakh' -> '100000', 'fifteen thousand' -> '15000', 'double seven zero one' -> '7701'). "
            "Output ONLY the command, nothing else.\n\nClient: " + text
        )
        try:
            r = await asyncio.to_thread(
                self.client.models.generate_content, model=config.BRAIN_MODEL, contents=prompt,
                config=types.GenerateContentConfig(temperature=0))
            return (r.text or text).strip()
        except Exception:  # noqa
            return text

    async def chat(self, user_text: str) -> dict:
        """Send a user utterance, execute all returned function calls, and return the final spoken text."""
        # Add user message to history
        self.history.append(types.Content(role="user", parts=[types.Part.from_text(text=user_text)]))

        spoken_parts = []
        ui_commands = []

        # Tool execution loop
        for _ in range(5):  # Safety limit of 5 turns
            response = await asyncio.to_thread(
                self.client.models.generate_content,
                model=config.BRAIN_MODEL,
                contents=self.history,
                config=self.cfg
            )

            # Check if there are function calls
            candidate = response.candidates[0]
            function_calls = [part.function_call for part in candidate.content.parts if part.function_call]

            # Collect any text spoken in this step
            text_parts = [part.text for part in candidate.content.parts if part.text]
            if text_parts:
                spoken_parts.extend(text_parts)

            # Add model response to history
            self.history.append(candidate.content)

            if not function_calls:
                break

            # Execute function calls
            function_response_parts = []
            for fc in function_calls:
                fn_name = fc.name
                fn_args = dict(fc.args) if fc.args else {}
                handler = HANDLERS.get(fn_name)
                if handler:
                    result = handler(self.session, **fn_args)
                else:
                    result = {"error": f"Unknown tool {fn_name}"}

                function_response_parts.append(
                    types.Part.from_function_response(name=fn_name, response={"result": result})
                )

            # Collect UI commands queued during tool execution
            ui_commands.extend(self.session.drain_outbox())

            # Append function responses to history for next model pass
            self.history.append(types.Content(role="tool", parts=function_response_parts))

        return {
            "text": " ".join(spoken_parts).strip(),
            "ui_commands": ui_commands
        }
