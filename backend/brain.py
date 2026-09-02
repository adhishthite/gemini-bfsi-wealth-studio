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


TOOL_LABELS = {
    "get_portfolio_diagnostics": "Auditing Asset Allocation & Portfolio Drift...",
    "simulate_portfolio": "Simulating 15-Year Goal Compounding Cone...",
    "filter_catalog": "Scanning Curated Institutional Fund Universe...",
    "stage_basket_order": "Staging Advisory Allocation Basket...",
    "generate_proposal_pdf": "Generating Official SEBI Advisory Proposal PDF...",
    "execute_mandate": "Verifying OTP & Authorizing e-NACH Mandate...",
}


class GeminiBrain:
    def __init__(self, session: WealthSession):
        self.session = session
        self.client = genai.Client(
            vertexai=True, project=config.BRAIN_PROJECT, location=config.BRAIN_LOCATION
        )
        self.name = config.AVATAR_NAME or "Ananya"
        self._build_cfg()
        self.history: list[types.Content] = []

    def _build_cfg(self):
        self.cfg = types.GenerateContentConfig(
            tools=[tools.TOOL],
            temperature=0.6,
            thinking_config=types.ThinkingConfig(thinking_budget=0),
            system_instruction=tools.system_instruction(
                self.session.profile, self.name
            ),
            automatic_function_calling=types.AutomaticFunctionCallingConfig(
                disable=True
            ),
        )

    def set_persona(self, avatar: str):
        if avatar:
            self.name = avatar
            self._build_cfg()

    def refresh_profile(self):
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
                self.client.models.generate_content,
                model=config.BRAIN_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0,
                    thinking_config=types.ThinkingConfig(thinking_budget=0),
                ),
            )
            return (r.text or text).strip()
        except Exception:  # noqa
            return text

    async def chat(
        self,
        user_text: str,
        on_step=None,
        on_chunk=None,
    ) -> dict:
        """Send a user utterance, execute all returned function calls, and stream real-time updates."""
        # Add user message to history
        self.history.append(
            types.Content(role="user", parts=[types.Part.from_text(text=user_text)])
        )

        spoken_parts = []
        ui_commands = []

        if on_step:
            await on_step(
                {"type": "status_step", "step": "Consulting Fiduciary Brain..."}
            )

        # Tool execution loop
        for turn_idx in range(5):  # Safety limit of 5 turns
            response = await asyncio.to_thread(
                self.client.models.generate_content,
                model=config.BRAIN_MODEL,
                contents=self.history,
                config=self.cfg,
            )

            # Check if there are function calls
            candidate = response.candidates[0]
            function_calls = [
                part.function_call
                for part in candidate.content.parts
                if part.function_call
            ]

            # Collect any text spoken in this step
            text_parts = [part.text for part in candidate.content.parts if part.text]
            if text_parts:
                for chunk in text_parts:
                    spoken_parts.append(chunk)
                    if on_chunk:
                        await on_chunk(chunk)

            # Add model response to history
            self.history.append(candidate.content)

            if not function_calls:
                break

            # Execute function calls
            function_response_parts = []
            for fc in function_calls:
                fn_name = fc.name
                fn_args = dict(fc.args) if fc.args else {}
                label = TOOL_LABELS.get(fn_name, f"Executing {fn_name}...")

                if on_step:
                    await on_step(
                        {
                            "type": "status_step",
                            "step": label,
                            "tool": fn_name,
                            "args": fn_args,
                        }
                    )

                handler = HANDLERS.get(fn_name)
                if handler:
                    result = handler(self.session, **fn_args)
                else:
                    result = {"error": f"Unknown tool {fn_name}"}

                # Drain and emit UI commands immediately for real-time responsiveness
                fresh_commands = self.session.drain_outbox()
                ui_commands.extend(fresh_commands)
                if on_step:
                    for cmd in fresh_commands:
                        await on_step(cmd)

                function_response_parts.append(
                    types.Part.from_function_response(
                        name=fn_name, response={"result": result}
                    )
                )

            # Append function responses to history for next model pass
            self.history.append(
                types.Content(role="tool", parts=function_response_parts)
            )

        final_text = " ".join(spoken_parts).strip()
        return {"text": final_text, "ui_commands": ui_commands}
