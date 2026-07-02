"""Generative Virtual Try-On using Gemini 3 Pro Image (image-to-image).

Composites the shopper's base photo + garment flat-lays into a single photoreal image
set in a context that matches the occasion. Returns a data: URL + caption.
"""
from __future__ import annotations
import base64, io
from pathlib import Path

from google import genai
from google.genai import types
from PIL import Image

from . import config

def _make_client() -> genai.Client:
    # Build a fresh client per call. A module-level singleton gets its httpx context bound to the loop/thread
    # it was created on; reused from the VTO worker thread it raises
    # "Context has already been used to create a Connection, it cannot be mutated again".
    return genai.Client(enterprise=True, project=config.IMAGE_PROJECT, location=config.IMAGE_LOCATION)

_SCENES = {
    "udaipur": "an elegant Udaipur palace courtyard at golden hour with Rajasthani arches",
    "goa": "a sunlit Goa beach at sunset with gentle waves and palms",
    "diwali": "a warmly lit Indian home decorated for Diwali with diyas and marigolds",
    "studio": "a clean, softly-lit fashion studio with a neutral backdrop",
    "work": "a bright modern Bengaluru office cafe with soft daylight",
}


def _asset_bytes(rel: str) -> bytes:
    p = config.ASSETS_DIR / Path(rel).relative_to("assets")
    return p.read_bytes()


def _scene_for(context: str | None) -> str:
    c = (context or "").lower()
    for k, v in _SCENES.items():
        if k in c:
            return v
    if any(w in c for w in ["beach", "sea", "coast"]):
        return _SCENES["goa"]
    if any(w in c for w in ["wedding", "sangeet", "festive", "reception", "palace"]):
        return _SCENES["udaipur"]
    return _SCENES["studio"]


_MALE_BASE = "assets/model/arjun_base.png"
_FEMALE_BASE = "assets/model/aisha_base.png"


def _vto_gender(session, sku_ids: list[str]) -> str:
    """Pick the model gender from the selected items (majority); fall back to the shopper's gender."""
    gs = [g for sid in sku_ids if (g := (session.by_id.get(sid) or {}).get("gender"))]
    if gs:
        return "men" if gs.count("men") > gs.count("women") else "women"
    return "men" if getattr(session, "user_gender", "women") == "men" else "women"


def generate_vto(session, sku_ids: list[str], context: str | None):
    gender = _vto_gender(session, sku_ids)            # from the selected items (falls back to shopper gender)
    pron, model_desc = ("him", "man") if gender == "men" else ("her", "woman")
    base_rel = _MALE_BASE if gender == "men" else _FEMALE_BASE   # Arjun (men) / Aisha (women) base model
    parts: list = []
    try:
        parts.append(types.Part.from_bytes(data=_asset_bytes(base_rel), mime_type="image/png"))
        person_clause = f"Use the FIRST image as the exact person (keep {pron} face and body)."
    except Exception:
        person_clause = f"Generate a realistic Indian {model_desc} model in their early 30s."

    # Only worn garments/footwear go into the try-on. Accessories (umbrella, bags, etc.) render unreliably
    # and often don't match the catalogue piece, so they're excluded from the composite.
    names = []
    for sid in sku_ids:
        it = session.by_id.get(sid)
        if not it or it.get("category") == "Accessory":
            continue
        try:
            parts.append(types.Part.from_bytes(data=_asset_bytes(it["image"]), mime_type="image/png"))
        except Exception:
            continue
        names.append(it["name"])

    scene = _scene_for(context)
    prompt = (
        f"{person_clause} Dress {pron} in this complete Cymbal Direct outfit shown in the other images: "
        f"{', '.join(names)}. Reproduce EACH garment EXACTLY as in its reference image — same cut, colour, "
        f"pattern and details, INCLUDING any attached hood. Do NOT invent or add any garment that isn't in the "
        f"references (no extra hoodie, sweatshirt, t-shirt or visible inner layer). "
        f"Render a single photorealistic FULL-LENGTH fashion photograph of this "
        f"{model_desc} wearing the look together, naturally fitted, standing confidently in {scene}. "
        f"FRAMING IS CRITICAL: show the ENTIRE figure from the top of the head down to the shoes/feet, with "
        f"comfortable empty margin ABOVE the head and BELOW the feet. Do NOT crop the face, head or feet — the "
        f"whole body including footwear must be fully visible, like a full-length lookbook shot. "
        f"Flattering natural lighting, sharp focus, realistic fabric drape, magazine-quality. No text or watermark."
    )
    parts.append(types.Part(text=prompt))

    client = _make_client()   # keep a strong ref for the whole call (a temporary gets GC'd → httpx closed)
    resp = client.models.generate_content(
        model=config.VTO_MODEL,
        contents=parts,
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE", "TEXT"],
            image_config=types.ImageConfig(aspect_ratio="9:16", output_mime_type="image/png", image_size="2K"),
        ),
    )
    cand = resp.candidates[0]
    img = next((p.inline_data.data for p in cand.content.parts if getattr(p, "inline_data", None)), None)
    if not img:
        raise RuntimeError(f"VTO produced no image (finish={cand.finish_reason})")
    # downscale a touch for fast transport
    im = Image.open(io.BytesIO(img)).convert("RGB")
    buf = io.BytesIO(); im.save(buf, format="JPEG", quality=88)
    data_url = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()
    caption = f"{', '.join(names)} — styled for {context or 'you'}"
    return data_url, caption
