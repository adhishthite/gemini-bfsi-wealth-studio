#!/usr/bin/env python3
"""Generate all India-contextualized mockup imagery for Cymbal Direct Style Studio
using Gemini 3 Pro Image (Nano Banana Pro) on your configured GCP project (GCP_PROJECT / IMAGE_PROJECT in .env).

Idempotent: skips files that already exist unless --force. Concurrency-limited.

  python scripts/gen_assets.py            # generate everything missing
  python scripts/gen_assets.py --force    # regenerate all
  python scripts/gen_assets.py --only catalog   # catalog | model | backdrops | avatar
"""
import argparse, json, os, sys, io
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from google import genai
from google.genai import types
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "frontend" / "public" / "assets"
CATALOG = json.loads((ROOT / "backend" / "data" / "catalog.json").read_text())

try:
    from dotenv import load_dotenv
    load_dotenv(ROOT / ".env")
except Exception:
    pass

PROJECT = (os.environ.get("IMAGE_PROJECT") or os.environ.get("GCP_PROJECT") or "").strip()
LOCATION = (os.environ.get("IMAGE_LOCATION") or "global").strip()
MODEL = (os.environ.get("IMAGE_MODEL") or "gemini-3-pro-image").strip()
client = genai.Client(enterprise=True, project=PROJECT, location=LOCATION)


def _generate(prompt: str, aspect: str, size: str) -> bytes:
    resp = client.models.generate_content(
        model=MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE", "TEXT"],
            image_config=types.ImageConfig(
                aspect_ratio=aspect, output_mime_type="image/png", image_size=size
            ),
        ),
    )
    cand = resp.candidates[0]
    if cand.finish_reason and cand.finish_reason != types.FinishReason.STOP:
        raise RuntimeError(f"finish_reason={cand.finish_reason}")
    for p in cand.content.parts:
        if getattr(p, "inline_data", None):
            return p.inline_data.data
    raise RuntimeError("no image part returned")


def _save(data: bytes, out: Path, resize=None):
    out.parent.mkdir(parents=True, exist_ok=True)
    if resize:
        im = Image.open(io.BytesIO(data)).convert("RGB").resize(resize)
        im.save(out, format="PNG")
    else:
        out.write_bytes(data)


def _job(name, prompt, out: Path, aspect="1:1", size="1K", resize=None, force=False):
    if out.exists() and not force:
        return f"skip  {name}"
    data = _generate(prompt, aspect, size)
    _save(data, out, resize=resize)
    return f"ok    {name}  ({out.relative_to(ROOT)})"


def catalog_jobs(force):
    for item in CATALOG:
        yield (item["id"], item["prompt"], ASSETS / Path(item["image"]).relative_to("assets"),
               "1:1", "1K", None, force)


def model_jobs(force):
    base_prompt_f = (
        "Full-body studio photograph of an Indian woman in her early 30s, around 165cm, "
        "standing straight and facing the camera, relaxed neutral expression, arms at her sides, "
        "wearing simple fitted neutral light-grey activewear (fitted top and leggings) so garments can be "
        "visualised over it, hair tied back, barefoot, on a plain seamless light-grey studio background, "
        "even soft lighting, full figure visible head to toe, sharp focus, high resolution, no text."
    )
    yield ("aisha_base", base_prompt_f, ASSETS / "model" / "aisha_base.png", "9:16", "2K", None, force)
    base_prompt_m = (
        "Full-body studio photograph of an Indian man in his early 30s, around 178cm, "
        "standing straight and facing the camera, relaxed neutral expression, arms at his sides, "
        "wearing simple fitted neutral light-grey activewear (fitted t-shirt and joggers) so garments can be "
        "visualised over it, short tidy hair, clean-shaven, barefoot, on a plain seamless light-grey studio "
        "background, even soft lighting, full figure visible head to toe, sharp focus, high resolution, no text."
    )
    yield ("arjun_base", base_prompt_m, ASSETS / "model" / "arjun_base.png", "9:16", "2K", None, force)


def backdrop_jobs(force):
    backs = {
        "udaipur": "A serene Udaipur palace courtyard at golden hour, ornate Rajasthani arches and marble, "
                   "warm soft light, empty (no people), cinematic depth, photographic, no text.",
        "goa": "A calm Goa beach at sunset with gentle waves and palm silhouettes, warm golden light, "
               "empty (no people), photographic, no text.",
        "diwali": "A warmly lit Indian home interior decorated for Diwali with diyas and marigold garlands, "
                  "soft bokeh fairy lights, empty (no people), photographic, no text.",
    }
    for k, p in backs.items():
        yield (f"backdrop_{k}", p, ASSETS / "backdrops" / f"{k}.png", "16:9", "1K", None, force)


def avatar_jobs(force):
    # Reuse the already-generated stylist portrait if present; else generate.
    src = ROOT / "scripts" / "_avatar_stylist.png"
    out = ASSETS / "avatar" / "aria.png"
    if src.exists() and not (out.exists() and not force):
        _save(src.read_bytes(), out, resize=(704, 1280))
        return [(f"avatar_aria  (from cached portrait)")]
    prompt = (
        "Professional studio portrait of a warm friendly Indian woman fashion stylist in her early 30s, "
        "head and shoulders, looking directly at camera, calm neutral closed-mouth expression, "
        "shoulder-length dark hair, minimal jewellery, elegant deep-magenta blouse, plain light-grey "
        "studio backdrop, soft even lighting, sharp focus, no hands, no text, portrait orientation."
    )
    return [("avatar_aria", prompt, out, "9:16", "2K", (704, 1280), force)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--only", choices=["catalog", "model", "backdrops", "avatar"], default=None)
    ap.add_argument("--workers", type=int, default=3)
    ap.add_argument("--model", default=None, help="override image model (e.g. gemini-3.1-flash-image)")
    args = ap.parse_args()
    if args.model:
        global MODEL
        MODEL = args.model

    jobs = []
    groups = {"catalog": catalog_jobs, "model": model_jobs, "backdrops": backdrop_jobs}
    if args.only in groups:
        jobs += list(groups[args.only](args.force))
    elif args.only == "avatar":
        pass
    else:
        for g in groups.values():
            jobs += list(g(args.force))

    # avatar handled specially (may copy cached file synchronously)
    if args.only in (None, "avatar"):
        for av in avatar_jobs(args.force):
            if isinstance(av, str):
                print(av)
            else:
                jobs.append(av)

    print(f"Generating {len(jobs)} image(s) with {MODEL} on {PROJECT} (workers={args.workers})…")
    ok = err = 0
    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        futs = {ex.submit(_job, *j): j[0] for j in jobs}
        for f in as_completed(futs):
            try:
                msg = f.result(); print(msg); ok += msg.startswith("ok") or msg.startswith("skip")
            except Exception as e:
                err += 1; print(f"FAIL  {futs[f]}: {str(e)[:160]}")
    print(f"Done. {ok} ok/skip, {err} failed.")
    sys.exit(1 if err else 0)


if __name__ == "__main__":
    main()
