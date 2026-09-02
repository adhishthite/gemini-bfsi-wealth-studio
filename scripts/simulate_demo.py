#!/usr/bin/env python3
"""Scripted, MULTILINGUAL demo simulation + reliability probe for the Live-Avatar voice pipeline.

The live demo drives every action from what the shopper SAYS, through a 3-hop chain:

    avatar ASR  →  brain.to_english()  →  session.handle_speech()  →  ui_command

The logged-in shopper is our male customer **Arjun Mehra** (Mumbai); the catalog defaults to men's wear.
brain.to_english() handles ANY language (Gemini is natively multilingual), so the SAME demo can be run in
English, Hindi, Hinglish, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati, Malayalam, Punjabi, …

This harness runs the fixed demo through the REAL pipeline for one or more languages and reports, per turn,
PASS/FAIL vs the expected action — so we know the lines route correctly BEFORE the live demo.

    # priority languages (default): English, Hindi, Hinglish
    BRAIN_PROJECT=$PROJECT_ID BRAIN_LOCATION=global BRAIN_MODEL=gemini-3.5-flash \
    GCP_PROJECT=$PROJECT_ID GCP_LOCATION=global python scripts/simulate_demo.py

    python scripts/simulate_demo.py --langs en,hi,hinglish,ta,bn   # add more languages
    python scripts/simulate_demo.py --langs all                    # every language defined below
    python scripts/simulate_demo.py --langs hi --repeat 3          # variance probe
    python scripts/simulate_demo.py --emit-md                      # (re)generate DEMO_SCRIPT_MULTILANG.md
"""

from __future__ import annotations
import argparse, asyncio, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from backend.session import CommerceSession  # noqa: E402
from backend.brain import GeminiBrain  # noqa: E402

LANG_NAMES = {
    "en": "English",
    "hi": "Hindi",
    "hinglish": "Hinglish",
    "ta": "Tamil",
    "te": "Telugu",
    "kn": "Kannada",
    "bn": "Bengali",
    "mr": "Marathi",
    "gu": "Gujarati",
    "ml": "Malayalam",
    "pa": "Punjabi",
}
PRIORITY = ["en", "hi", "hinglish"]

# TIGHT 7-turn end-to-end demo (≈3–4 min live), men's / Arjun-oriented monsoon look.
# Each turn: expected handle_speech action + the same line in every language. Turn 8 is an OPTIONAL bonus
# (switch to women's catalog for a gift) — skip it for the timed run.
TURNS = [
    {
        "act": "filter",
        "note": "Discover monsoon rainwear (men's)",
        "en": "Namaste! Show me some rainwear for this monsoon",
        "hi": "नमस्ते! इस मानसून के लिए मुझे कुछ रेनवियर दिखाइए",
        "hinglish": "Namaste! Is monsoon ke liye mujhe kuch rainwear dikhao",
        "ta": "வணக்கம்! இந்த மழைக்காலத்துக்கு சில ரெயின்வேர் காட்டுங்கள்",
        "te": "నమస్తే! ఈ వర్షాకాలానికి కొంత రెయిన్‌వేర్ చూపించండి",
        "kn": "ನಮಸ್ತೆ! ಈ ಮಳೆಗಾಲಕ್ಕೆ ಸ್ವಲ್ಪ ರೈನ್‌ವೇರ್ ತೋರಿಸಿ",
        "bn": "নমস্কার! এই বর্ষার জন্য আমাকে কিছু রেইনওয়্যার দেখান",
        "mr": "नमस्कार! या पावसाळ्यासाठी मला काही रेनवेअर दाखवा",
        "gu": "નમસ્તે! આ ચોમાસા માટે મને થોડું રેઇનવેર બતાવો",
        "ml": "നമസ്കാരം! ഈ മഴക്കാലത്തേക്ക് കുറച്ച് റെയിൻവെയർ കാണിക്കൂ",
        "pa": "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਇਸ ਮੌਨਸੂਨ ਲਈ ਮੈਨੂੰ ਕੁਝ ਰੇਨਵੇਅਰ ਦਿਖਾਓ",
    },
    {
        "act": "add",
        "note": "Add the navy rain jacket",
        "en": "Add the navy rain jacket to my cart",
        "hi": "नेवी रेन जैकेट मेरी कार्ट में डाल दो",
        "hinglish": "Yeh navy wala rain jacket cart mein add kar do",
        "ta": "அந்த நேவி ரெயின் ஜாக்கெட்டை என் கார்ட்டில் சேருங்கள்",
        "te": "ఆ నేవీ రెయిన్ జాకెట్‌ను నా కార్ట్‌లో జోడించు",
        "kn": "ಆ ನೇವಿ ರೈನ್ ಜಾಕೆಟ್ ಅನ್ನು ನನ್ನ ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿ",
        "bn": "ওই নেভি রেন জ্যাকেটটা আমার কার্টে যোগ করো",
        "mr": "ती नेव्ही रेन जॅकेट माझ्या कार्टमध्ये टाक",
        "gu": "પેલી નેવી રેઇન જેકેટ મારી કાર્ટમાં ઉમેરો",
        "ml": "ആ നേവി റെയിൻ ജാക്കറ്റ് എന്റെ കാർട്ടിൽ ചേർക്കൂ",
        "pa": "ਉਹ ਨੇਵੀ ਰੇਨ ਜੈਕਟ ਮੇਰੀ ਕਾਰਟ ਵਿੱਚ ਪਾ ਦਿਓ",
    },
    {
        "act": "complete",
        "note": "ONE turn → adds matching rain pants + waterproof shoes",
        "en": "Complete the look with matching rain pants and waterproof shoes",
        "hi": "मैचिंग रेन पैंट और वॉटरप्रूफ जूतों के साथ पूरा लुक कम्प्लीट कर दो",
        "hinglish": "Matching rain pants aur waterproof shoes ke saath pura look complete kar do",
        "ta": "பொருந்தும் ரெயின் பேண்ட் மற்றும் வாட்டர்ப்ரூஃப் ஷூவுடன் முழு லுக்கை முடியுங்கள்",
        "te": "మ్యాచింగ్ రెయిన్ ప్యాంట్ మరియు వాటర్‌ప్రూఫ్ షూస్‌తో లుక్‌ను పూర్తి చేయి",
        "kn": "ಹೊಂದುವ ರೈನ್ ಪ್ಯಾಂಟ್ ಮತ್ತು ವಾಟರ್‌ಪ್ರೂಫ್ ಶೂಗಳೊಂದಿಗೆ ಲುಕ್ ಪೂರ್ಣಗೊಳಿಸಿ",
        "bn": "ম্যাচিং রেন প্যান্ট আর ওয়াটারপ্রুফ জুতো দিয়ে পুরো লুকটা সম্পূর্ণ করো",
        "mr": "मॅचिंग रेन पँट आणि वॉटरप्रूफ शूजसह संपूर्ण लूक पूर्ण कर",
        "gu": "મેચિંગ રેઇન પેન્ટ અને વોટરપ્રૂફ શૂઝ સાથે આખો લુક પૂરો કરો",
        "ml": "മാച്ചിങ് റെയിൻ പാന്റും വാട്ടർപ്രൂഫ് ഷൂസും ചേർത്ത് ലുക്ക് പൂർത്തിയാക്കൂ",
        "pa": "ਮੈਚਿੰਗ ਰੇਨ ਪੈਂਟ ਅਤੇ ਵਾਟਰਪ੍ਰੂਫ਼ ਜੁੱਤੀਆਂ ਨਾਲ ਪੂਰਾ ਲੁੱਕ ਪੂਰਾ ਕਰੋ",
    },
    {
        "act": "vto",
        "note": "Virtual try-on of the FULL look on Arjun (head-to-toe)",
        "en": "Show me the whole look on me",
        "hi": "मुझे पूरा लुक मुझ पर दिखाओ",
        "hinglish": "Mujhe pura look mujh par try-on karke dikhao",
        "ta": "முழு லுக்கையும் என் மீது காட்டுங்கள்",
        "te": "మొత్తం లుక్‌ను నా మీద చూపించు",
        "kn": "ಪೂರ್ಣ ಲುಕ್ ಅನ್ನು ನನ್ನ ಮೇಲೆ ತೋರಿಸಿ",
        "bn": "পুরো লুকটা আমার গায়ে দেখাও",
        "mr": "संपूर्ण लूक माझ्यावर दाखव",
        "gu": "આખો લુક મારા પર બતાવો",
        "ml": "മുഴുവൻ ലുക്കും എന്റെ മേൽ കാണിക്കൂ",
        "pa": "ਪੂਰਾ ਲੁੱਕ ਮੇਰੇ 'ਤੇ ਦਿਖਾਓ",
    },
    {
        "act": "checkout",
        "note": "Checkout — Arjun's saved Mumbai address + Mastercard shown",
        "en": "Great, let's check out",
        "hi": "बढ़िया, अब चेकआउट करते हैं",
        "hinglish": "Badhiya, ab checkout karte hain",
        "ta": "அருமை, இப்போது செக்அவுட் செய்வோம்",
        "te": "బాగుంది, ఇప్పుడు చెకౌట్ చేద్దాం",
        "kn": "ಚೆನ್ನಾಗಿದೆ, ಈಗ ಚೆಕೌಟ್ ಮಾಡೋಣ",
        "bn": "দারুণ, এবার চেকআউট করি",
        "mr": "छान, आता चेकआउट करूया",
        "gu": "સરસ, હવે ચેકઆઉટ કરીએ",
        "ml": "കൊള്ളാം, ഇനി ചെക്ക്ഔട്ട് ചെയ്യാം",
        "pa": "ਵਧੀਆ, ਹੁਣ ਚੈੱਕਆਊਟ ਕਰੀਏ",
    },
    {
        "act": "promo",
        "note": "Apply promo DIRECT15 (total drops)",
        "en": "Apply the coupon code DIRECT15",
        "hi": "कूपन कोड DIRECT15 लगा दो",
        "hinglish": "DIRECT15 coupon code laga do",
        "ta": "DIRECT15 கூப்பன் கோடைப் போடுங்கள்",
        "te": "DIRECT15 కూపన్ కోడ్‌ను వర్తింపజేయి",
        "kn": "DIRECT15 ಕೂಪನ್ ಕೋಡ್ ಅನ್ನು ಅನ್ವಯಿಸಿ",
        "bn": "DIRECT15 কুপন কোডটা প্রয়োগ করো",
        "mr": "DIRECT15 कूपन कोड लाव",
        "gu": "DIRECT15 કૂપન કોડ લગાવો",
        "ml": "DIRECT15 കൂപ്പൺ കോഡ് ചേർക്കൂ",
        "pa": "DIRECT15 ਕੂਪਨ ਕੋਡ ਲਗਾ ਦਿਓ",
    },
    {
        "act": "payment",
        "note": "Place order → opens the SECURE CVV popup; shopper types the CVV there (never spoken)",
        "en": "Okay, place my order",
        "hi": "ठीक है, मेरा ऑर्डर प्लेस कर दो",
        "hinglish": "Theek hai, mera order place kar do",
        "ta": "சரி, என் ஆர்டரைப் போடுங்கள்",
        "te": "సరే, నా ఆర్డర్ ప్లేస్ చేయి",
        "kn": "ಸರಿ, ನನ್ನ ಆರ್ಡರ್ ಪ್ಲೇಸ್ ಮಾಡಿ",
        "bn": "ঠিক আছে, আমার অর্ডারটা প্লেস করো",
        "mr": "ठीक आहे, माझी ऑर्डर प्लेस कर",
        "gu": "ઠીક છે, મારો ઓર્ડર પ્લેસ કરો",
        "ml": "ശരി, എന്റെ ഓർഡർ പ്ലേസ് ചെയ്യൂ",
        "pa": "ਠੀਕ ਹੈ, ਮੇਰਾ ਆਰਡਰ ਪਲੇਸ ਕਰ ਦਿਓ",
    },
    {
        "act": "filter",
        "note": "OPTIONAL bonus — switch to women's catalog for a gift (identity stays male)",
        "en": "Now show me something for my wife for a Goa beach wedding",
        "hi": "अब मेरी पत्नी के लिए गोवा बीच वेडिंग के लिए कुछ दिखाओ",
        "hinglish": "Ab meri wife ke liye Goa beach wedding ke liye kuch dikhao",
        "ta": "இப்போது என் மனைவிக்கு கோவா கடற்கரை திருமணத்துக்கு ஏதாவது காட்டுங்கள்",
        "te": "ఇప్పుడు నా భార్య కోసం గోవా బీచ్ వెడ్డింగ్‌కు ఏదైనా చూపించు",
        "kn": "ಈಗ ನನ್ನ ಹೆಂಡತಿಗೆ ಗೋವಾ ಬೀಚ್ ಮದುವೆಗೆ ಏನಾದರೂ ತೋರಿಸಿ",
        "bn": "এবার আমার স্ত্রীর জন্য গোয়া বিচ ওয়েডিংয়ের কিছু দেখাও",
        "mr": "आता माझ्या बायकोसाठी गोवा बीच वेडिंगसाठी काहीतरी दाखव",
        "gu": "હવે મારી પત્ની માટે ગોવા બીચ વેડિંગ માટે કંઈક બતાવો",
        "ml": "ഇനി എന്റെ ഭാര്യയ്ക്ക് ഗോവ ബീച്ച് വെഡിങ്ങിന് എന്തെങ്കിലും കാണിക്കൂ",
        "pa": "ਹੁਣ ਮੇਰੀ ਪਤਨੀ ਲਈ ਗੋਆ ਬੀਚ ਵੈਡਿੰਗ ਲਈ ਕੁਝ ਦਿਖਾਓ",
    },
]


def _fresh_session() -> CommerceSession:
    s = CommerceSession()  # defaults: male customer Arjun, catalog gender = men
    return s


async def run_lang(brain_session, lang: str, verbose=True) -> tuple[int, int]:
    brain, session = brain_session
    ok = 0
    if verbose:
        print(f"\n=== {LANG_NAMES.get(lang, lang)} ({lang}) ===")
    for i, turn in enumerate(TURNS, 1):
        say = turn[lang]
        english = await brain.to_english(say)
        action = session.handle_speech(english)
        passed = action == turn["act"]
        ok += passed
        if verbose:
            print(f"{'✅' if passed else '❌'} [{i:02d}] {say}")
            print(f"      → en={english!r}  action={action!r} (want {turn['act']!r})")
        session.drain()
    return ok, len(TURNS)


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--langs",
        default=",".join(PRIORITY),
        help="comma list of language codes, or 'all' (default: en,hi,hinglish)",
    )
    ap.add_argument(
        "--repeat", type=int, default=1, help="repeat the whole run N times (variance)"
    )
    ap.add_argument(
        "--emit-md", action="store_true", help="write DEMO_SCRIPT_MULTILANG.md and exit"
    )
    args = ap.parse_args()

    if args.emit_md:
        emit_md()
        return

    langs = (
        list(LANG_NAMES)
        if args.langs == "all"
        else [l.strip() for l in args.langs.split(",") if l.strip()]
    )
    bad = [l for l in langs if l not in LANG_NAMES]
    if bad:
        print(f"unknown languages: {bad} (known: {list(LANG_NAMES)})")
        sys.exit(1)

    grand = {}
    for r in range(args.repeat):
        for lang in langs:
            s = _fresh_session()
            brain = GeminiBrain(s)
            ok, n = await run_lang((brain, s), lang)
            grand[lang] = grand.get(lang, (0, 0))
            grand[lang] = (grand[lang][0] + ok, grand[lang][1] + n)

    print("\n=== summary ===")
    total_ok = total_n = 0
    for lang in langs:
        ok, n = grand[lang]
        total_ok += ok
        total_n += n
        print(
            f"  {LANG_NAMES.get(lang, lang):10s} {ok}/{n}  {'✅' if ok == n else '⚠️'}"
        )
    print(f"  {'OVERALL':10s} {total_ok}/{total_n}")


def emit_md():
    """Generate DEMO_SCRIPT_MULTILANG.md from TURNS (single source of truth)."""
    out = [
        "# Cymbal Direct — Multilingual Demo Lines",
        "",
        "Same 11-turn demo (logged-in customer **Arjun Mehra**, default **men's** catalog; turn 11 switches to",
        "the women's catalog for a gift). Every line below is **validated through the real voice pipeline**",
        "(`brain.to_english → session.handle_speech`) by `scripts/simulate_demo.py`. Gemini is natively",
        "multilingual — these are priority + common Indian languages, and the avatar will understand others too.",
        "",
        "**Priority:** English · Hindi · Hinglish. Speak any line on hold-to-talk; the action fires the same way.",
        "",
        "| # | Action | " + " | ".join(LANG_NAMES[l] for l in LANG_NAMES) + " |",
        "|---|--------|" + "|".join(["---"] * len(LANG_NAMES)) + "|",
    ]
    for i, t in enumerate(TURNS, 1):
        row = [str(i), t["act"]] + [t[l].replace("|", "/") for l in LANG_NAMES]
        out.append("| " + " | ".join(row) + " |")
    out += [
        "",
        "## Notes",
        "- The shopper is always **Arjun** (he/him); checkout shows his Mumbai address + Mastercard regardless of language.",
        "- The **stylist** can be any of the six avatars (Kira/Ingrid/Vera = she/her, Jay/Paul/Sam = he/him) — independent of the shopper.",
        "- CVV: say the digits in any language (e.g. Hindi *एक दो तीन*); they're normalised to `123`. Or just type it in the box.",
        "- Turn 11 shows the catalog switching to **women's** for a gift while Arjun's identity stays male.",
        "",
        "_Regenerate this file:_ `python scripts/simulate_demo.py --emit-md`",
        "",
    ]
    p = ROOT / "DEMO_SCRIPT_MULTILANG.md"
    p.write_text("\n".join(out), encoding="utf-8")
    print(f"wrote {p}")


if __name__ == "__main__":
    asyncio.run(main())
