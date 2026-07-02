# Cymbal Direct — Style Studio · Demo & Test Runbook

A single script to run through end-to-end. Two layers:
- **Layer 1 (automated):** prove the voice→action pipeline routes correctly (no browser, fast).
- **Layer 2 (manual):** drive the actual UI + Live Avatar the way the demo audience will.

Run on the **Mac** (the Live Avatar needs a desktop browser + mic). The backend talks to GCP
via ADC, projects = `$LIVE_PROJECT`, brain = `gemini-3.5-flash`.

---

## 0. One-time setup

```bash
cd ~/Code/gemini-live-avatar-style-studio

# Python deps
python3 -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt

# Google auth (ADC) — needed for brain, image-gen, VTO, Live Avatar
gcloud auth application-default login

# Frontend build (the backend serves this)
cd frontend && npm install && npm run build && cd ..
```

`.env` is already set (projects `$LIVE_PROJECT`, locations us-central1 / image global, `AVATAR_TRANSPORT=live`).

---

## Layer 1 — Automated pipeline test (run this first, ~30s)

This runs the full monsoon demo through the **real** `to_english → handle_speech → ui_command`
chain and reports PASS/FAIL per turn, plus a variance probe (each turn repeated 3×).

```bash
source .venv/bin/activate
BRAIN_PROJECT=$PROJECT_ID BRAIN_LOCATION=global BRAIN_MODEL=gemini-3.5-flash \
GCP_PROJECT=$PROJECT_ID GCP_LOCATION=global \
python scripts/simulate_demo.py --repeat 3
```

**Expect:** the priority languages (English/Hindi/Hinglish) routing the demo to the right actions.

**Multilingual:** the demo runs in many Indian languages (Gemini is natively multilingual):
```bash
python scripts/simulate_demo.py --langs all          # validate every language
python scripts/simulate_demo.py --langs en,hi,ta     # pick languages
python scripts/simulate_demo.py --emit-md            # regenerate DEMO_SCRIPT_MULTILANG.md
```
All the spoken lines per language live in **`DEMO_SCRIPT_MULTILANG.md`** (priority: English · Hindi · Hinglish;
also Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati, Malayalam, Punjabi). The demo is a tight **7-turn**
flow (+1 optional bonus). Priority languages route **8/8** each (English/Hindi/Hinglish 24/24).

> Uses `$PROJECT_ID` for the LLM because that's the project this CLI can call. On your Mac you can
> also just use the default `.env` (`$LIVE_PROJECT`) by dropping the `BRAIN_*`/`GCP_*` overrides.

---

## Layer 2 — Manual UI + Live Avatar test

Start the app:

```bash
source .venv/bin/activate
uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

Open **http://127.0.0.1:8000** in Chrome.

### A. Home page = "Latest Collection"  ✅ the new change
- [ ] Top shows the **gradient hero "The Latest Collection · Just dropped"** mentioning monsoon rainwear.
- [ ] Heading below is **"New In"** with a "new & trending pieces" count.
- [ ] The first row is **latest seasonal/western** pieces (co-ords, linen shirts, maxi dresses, polos,
      jumpsuits, tracksuits) — **NOT** lehengas/sarees/sherwanis.
- [ ] Men's and women's items **alternate** down the grid.
- [ ] Scroll far down → bridal/festive ethnic still exists (just no longer leading).

### B. Catalog filters (new rainwear)
- [ ] Click the **"Rainwear"** category chip → shows rain jackets, windcheaters, raincoats, rain boots, umbrellas.
- [ ] Use the **occasion** dropdown → **monsoon** → shows the full monsoon edit (M + W).
- [ ] Search box: type `raincoat`, `windcheater`, `umbrella` → relevant items appear.
- [ ] Switch **Men / Women** tabs → grid respects the section.
- [ ] Change **Sort** (Price / Newest) → reorders; clearing back to **Featured** restores the Latest Collection home.

### C. Live Avatar voice demo (Go Live) — the tight 3–4 min run ⏱️
1. Pick an avatar (any of the six — e.g. **Kira** or **Jay**) and click **Go Live**. Allow the mic.
2. Wait for the avatar video + "ready". Then **hold the talk button**, speak one line, **release**.
   **7 turns, one action each.** Hinglish shown; English/Hindi/other languages in `DEMO_SCRIPT_MULTILANG.md`.

| # | Say (hold-to-talk) | You should see | ~time |
|---|---|---|---|
| 1 | "Namaste! Is monsoon ke liye mujhe kuch rainwear dikhao" | grid filters to monsoon rainwear | 0:25 |
| 2 | "Yeh navy wala rain jacket add kar do" | Navy Rain Jacket added + toast | 0:45 |
| 3 | "Matching rain pants aur waterproof shoes ke saath pura look complete kar do" | **matching rain pants + waterproof shoes auto-added** (one turn) | 1:10 |
| 4 | "Mujhe pura look mujh par try-on karke dikhao" | VTO modal → **full head-to-toe look** on Arjun | 1:45 |
| 5 | "Badhiya, ab checkout karte hain" | checkout review — **saved Mumbai address + Mastercard shown** | 2:10 |
| 6 | "DIRECT15 coupon code laga do" | promo applied, total drops | 2:35 |
| 7 | "Theek hai, mera order place kar do" | **secure CVV popup opens** → type `123` → **order success** | 3:05 |

> **Why it's fast & hiccup-free:** turn 3 ("complete the look") builds the whole outfit in one turn instead of
> three; checkout already has the address + card, so it's one confirm + CVV. One press = one full sentence =
> one action — speak the whole sentence before releasing.
> **CVV is always typed in the secure popup — never spoken to the stylist.** After "place my order" the card
> popup opens; the stylist will ask you to enter the 3-digit CVV there yourself. Type `123` and tap Pay → success.
> **Optional bonus** (turn 8, adds ~30s): *"Ab meri wife ke liye Goa beach wedding ke liye kuch dikhao"* → the
> catalog switches to **women's** for a gift while the logged-in identity stays Arjun.

### D. Virtual Try-On — both genders
- [ ] **Women:** with a women's item shown, add it, say/click try-on → composited on **Aisha** in an Indian backdrop.
- [ ] **Men:** switch to Men, add e.g. a sherwani or rain jacket, try-on → composited on **Arjun** (male model).
- [ ] Try-on returns in ~10–20s with a caption.

### E. Checkout chain (manual, without voice)
- [ ] Add 2 items → open cart → **Checkout** → review already shows the **saved address + card** → (optional promo
      `DIRECT15`) → **Place order** → enter CVV `123` → **Order success** (₹ totals correct, discount applied).

### F. Logged-in identity = Arjun Mehra (male), default men's  ✅
- [ ] Top-right **profile chip** shows **Arjun Mehra** → opens to *Mumbai* (Oberoi Springs, 400053), **Mastercard ••5678**, sizes **Tops M · Bottoms 32 · Shoes UK9**.
- [ ] Default catalog = **Men** (the Men tab is selected on load); checkout always shows **Arjun**, Mumbai, Mastercard.
- [ ] **Women's is on request only** — say *"show me something for my wife…"* or tap the **Women** tab to browse women's (a gift); the logged-in identity stays Arjun.
- [ ] **Stylist is independent** — any of the six avatars works (Kira/Ingrid/Vera = she/her, Jay/Paul/Sam = he/him); the stylist's gender never changes the shopper.
- [ ] VTO uses the model matching the **item** shown (Arjun for men's, Aisha for a women's gift item).

---

## Quick smoke test (if short on time)
1. `python scripts/simulate_demo.py --langs en,hi,hinglish` → 8/8 per language.
2. Open the app → confirm the **Latest Collection** hero + men's first row + **Arjun** profile chip.
3. Go Live → run the 7 turns in section C (filter → add → complete-the-look → VTO → checkout → promo → order).

---

## Troubleshooting
- **Live Avatar won't connect:** the model is only confirmed on `us-central1`. If `LIVE_LOCATION=global`
  fails, set `LIVE_LOCATION=us-central1` in `.env` and restart.
- **No avatar audio:** the voice is muxed into the MP4 — make sure the browser tab isn't muted and you
  clicked into the page (autoplay policy). 
- **A voice action didn't fire:** check the uvicorn log for `🗣 heard:` / `🌐 … → action:`. If `heard`
  is partial, you released the button too early — hold through the whole sentence.
- **Filter shows the same page:** confirm the log shows a non-null action; if `action: None`, the phrasing
  missed — use the exact lines in the table above.
- **Images missing:** `python scripts/gen_assets.py` (idempotent; regenerates only missing assets).
```
