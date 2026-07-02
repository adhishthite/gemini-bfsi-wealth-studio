"""CommerceSession: per-connection demo state + tool handlers that drive the UI.

Each tool returns a JSON-able result for the model AND queues `ui_command` events
(in self.outbox) that the frontend reacts to. Slow work (VTO) is pushed
asynchronously via self.send().
"""
from __future__ import annotations
import json, asyncio, re
from pathlib import Path
from typing import Any, Callable, Optional

from . import config


def _load(name: str):
    return json.loads((config.DATA_DIR / name).read_text())


# map free-text occasion phrases → the catalog's occasion tokens (precise matching)
_OCC_SYNONYMS = {
    "beach-party": ["beach party", "beach wear", "beachwear", "pool party", "beach"],
    "goa": ["goa"],
    "beach-wedding": ["beach wedding", "destination wedding"],
    "awards": ["awards", "award function", "awards function", "awards night", "gala dinner"],
    "black-tie": ["black tie", "black-tie", "gala", "red carpet", "formal evening"],
    "cocktail": ["cocktail", "cocktail party"],
    "date-night": ["date night", "date"],
    "casual-friday": ["casual friday", "friday dressing", "smart casual"],
    "athleisure": ["athleisure", "athletic", "loungewear sport"],
    "gym": ["gym", "workout", "training"],
    "sports": ["sports", "sport"],
    "tennis": ["tennis"],
    "travel": ["travel", "airport", "vacation travel"],
    "festival": ["festival", "concert", "music festival"],
    "monsoon": ["monsoon", "rain", "rainy"],
    "loungewear": ["loungewear", "lounge", "home wear"],
    "work": ["work", "office", "formal", "business", "interview", "meeting"],
    "interview": ["interview", "job interview"],
    "work-casual": ["work casual", "smart casual"],
    "sangeet": ["sangeet"],
    "wedding": ["wedding", "shaadi"],
    "mehendi": ["mehendi", "mehndi"],
    "haldi": ["haldi"],
    "reception": ["reception"],
    "diwali": ["diwali", "deepavali"],
    "pooja": ["pooja", "puja", "festive pooja"],
    "festive": ["festive", "festival ethnic"],
    "resort": ["resort", "vacation", "holiday"],
    "brunch": ["brunch"],
    "party": ["party", "night out"],
    "everyday": ["everyday", "daily", "casual"],
}


# generic tokens are dropped when a more specific occasion is also present
_GENERIC_OCC = {"party", "everyday", "festive", "work", "work-casual", "brunch", "resort"}
# lower-weighted "related" occasions so results stay rich without mismatching
_RELATED_OCC = {
    "beach-party": {"resort", "goa", "vacation"},
    "awards": {"black-tie", "cocktail", "reception", "gala"},
    "black-tie": {"awards", "cocktail", "reception"},
    "casual-friday": {"work-casual", "everyday"},
    "athleisure": {"gym", "sports", "travel"},
    "gym": {"athleisure", "sports"},
    "festival": {"concert", "vacation", "brunch"},
    "travel": {"athleisure", "loungewear", "vacation"},
    "cocktail": {"party", "date-night", "reception"},
    "date-night": {"cocktail", "party"},
    "monsoon": {"travel"},
}


_STOP = {"the", "a", "an", "for", "me", "my", "show", "some", "something", "need", "want", "get",
         "have", "do", "you", "i", "we", "to", "in", "on", "of", "and", "or", "with", "please",
         "looking", "look", "find", "give", "see", "wear", "outfit", "outfits", "nice", "good",
         "can", "could", "would", "like", "this", "that", "these", "those", "is", "are", "it"}


def _qwords(text):
    return [w for w in re.findall(r"[a-z]+", (text or "").lower()) if len(w) > 2 and w not in _STOP]


def _tok_match(q: str, tk: str) -> bool:
    """Loose token match: equal, substring (≥4), or shared 5-char prefix (handles plurals/variants
    like accessories↔accessory, handbag↔handbags, sneaker↔sneakers)."""
    if q == tk:
        return True
    # substring only when BOTH tokens are reasonably long, else short tokens cause false hits
    # (e.g. fabric "art" matching "c-art" in "cart").
    if len(q) >= 4 and len(tk) >= 4 and (q in tk or tk in q):
        return True
    return len(q) >= 5 and len(tk) >= 5 and q[:5] == tk[:5]


def _occ_tokens(text):
    """Return the set of catalog occasion tokens implied by free text."""
    if not text:
        return set()
    t = " " + str(text).lower() + " "
    out = set()
    for token, phrases in _OCC_SYNONYMS.items():
        if token.replace("-", " ") in t or any(p in t for p in phrases):
            out.add(token)
    specific = out - _GENERIC_OCC
    return specific or out  # if a specific occasion was named, drop the generic noise


class CommerceSession:
    def __init__(self):
        self.catalog: list[dict] = _load("catalog.json")
        self._profiles: dict = _load("profiles.json")   # {"women": {...}, "men": {...}}
        self.promos: dict = _load("promos.json")
        self.by_id = {it["id"]: it for it in self.catalog}
        # vocabulary of nameable things (categories, name words, fabrics) for product-type queries
        self._vocab = set()
        for it in self.catalog:
            for w in (it["name"].lower().split() + [it["category"].lower()] + it["fabric"].lower().split()
                      + [c["name"].lower() for c in it["colors"]]):
                if len(w) > 2:
                    self._vocab.add(w)
        self.cart: list[dict] = []                 # [{sku_id, size, qty}]
        # The logged-in customer is MALE (Arjun). user_gender is the CATALOG section being shown — defaults to
        # men's; switches to women's only when he asks (e.g. a gift). The identity/profile stays male regardless.
        self.user_gender: str = "men"
        self.gender_locked: bool = False           # True when the user explicitly picked a section (tab) — overrides AI
        self._last_visible: list[str] = []         # sku_ids currently shown (for voice "add the navy one")
        self.applied_promo: Optional[str] = None
        self.orders: list[dict] = []               # placed orders (most-recent last) for "My Orders"
        self.outbox: list[dict] = []               # ui_command events to flush this turn
        self._send: Optional[Callable[[dict], Any]] = None  # async sender for out-of-band events

    def set_sender(self, send):
        self._send = send

    @property
    def profile(self) -> dict:
        """The logged-in shopper — a FIXED male customer (Arjun Mehra, Mumbai): name, address, card, sizes,
        history. The stylist avatar and the catalog section are separate; the identity is always male."""
        return self._profiles["men"]

    # ---------- helpers ----------
    def _ui(self, command: str, **args):
        self.outbox.append({"type": "ui_command", "command": command, "args": args})

    def drain(self) -> list[dict]:
        out, self.outbox = self.outbox, []
        return out

    def _card(self, it: dict) -> dict:
        return {"id": it["id"], "name": it["name"], "price": it["price"], "mrp": it.get("mrp"),
                "category": it["category"], "gender": it.get("gender"), "fabric": it["fabric"], "colors": it["colors"],
                "tags": it.get("tags", []), "image": it["image"], "occasions": it["occasions"],
                "description": it["description"]}

    def cart_view(self) -> dict:
        items, subtotal = [], 0
        for line in self.cart:
            it = self.by_id[line["sku_id"]]
            qty = line.get("qty", 1)
            subtotal += it["price"] * qty
            items.append({"sku_id": it["id"], "name": it["name"], "size": line.get("size"),
                          "qty": qty, "price": it["price"], "image": it["image"]})
        discount = self._discount(subtotal)
        return {"items": items, "subtotal": subtotal, "discount": discount,
                "total": subtotal - discount, "promo": self.applied_promo}

    def _discount(self, subtotal: int) -> int:
        if not self.applied_promo:
            return 0
        p = self.promos.get(self.applied_promo)
        if not p:
            return 0
        if p["type"] == "percent":
            return min(int(subtotal * p["value"] / 100), p.get("max_discount", 10**9))
        if p["type"] == "flat":
            return p["value"] if subtotal >= p.get("min_cart", 0) else 0
        return 0

    def suggest_size(self, sku_id: str) -> dict:
        it = self.by_id.get(sku_id)
        if not it:
            return {"error": "unknown sku"}
        cat = it["category"].lower()
        # size by the ITEM's gender (men's items → Arjun's sizes; a women's gift item → women's size chart)
        rs = self._profiles.get(it.get("gender", "men"), self._profiles["men"])["recommended_sizes"]
        if "Free" in it["sizes"]:
            size = "Free"
        elif "footwear" in cat:
            size = rs["footwear"]
        elif any(k in cat for k in ("trouser", "jeans", "chino", "short")):
            size = rs["bottoms"]
        else:
            size = rs["dresses"]
        if size not in it["sizes"]:
            size = it["sizes"][len(it["sizes"]) // 2]
        # learn from returns
        note = "Based on your measurements and past orders."
        for h in self.profile["purchase_history"]:
            if h["status"] == "returned" and h.get("reason") and it["category"] in h["name"]:
                note = f"We sized you up — last time: {h['reason']}."
        return {"sku_id": sku_id, "suggested_size": size, "rationale": note,
                "returns_rate": it.get("returns_rate")}

    # ---------- tool handlers (return JSON-able dict for the model) ----------
    def t_filter_catalog(self, occasion=None, fabrics=None, colors=None, categories=None,
                         weather=None, max_price=None, query=None, gender=None, **_) -> dict:
        # Shopper gender is dynamic. If the user explicitly picked a section (locked), that wins. Otherwise
        # the AI's inferred `gender` wins and is remembered. "all"/unset => balanced mix of both.
        if self.gender_locked and self.user_gender in ("women", "men"):
            g = self.user_gender
        else:
            g = (gender or "").lower().strip()
            if g in ("women", "men"):
                self.user_gender = g                   # remember the AI's inference for later turns
            else:
                g = self.user_gender if self.user_gender in ("women", "men") else None
        pool = [it for it in self.catalog if (not g or it.get("gender") == g)] or self.catalog

        # normalise the requested occasion(s) to our catalog occasion tokens (precise matching)
        want_occ = _occ_tokens(occasion) | _occ_tokens(query)
        spec = want_occ - _GENERIC_OCC
        if spec:
            want_occ = spec
        related = set()
        for tok in want_occ:
            related |= _RELATED_OCC.get(tok, set())
        related -= want_occ
        fabrics = [f.lower() for f in (fabrics or [])]
        colors = [c.lower() for c in (colors or [])]
        categories = [c.lower() for c in (categories or [])]
        wx = (weather or "").lower()

        qwords = _qwords(query)
        matches = []
        for it in pool:
            occ = set(o.lower() for o in it["occasions"])
            itoks = (set(it["name"].lower().split()) | {it["category"].lower()}
                     | set(it["fabric"].lower().split()) | {c["name"].lower() for c in it["colors"]})
            score = 0
            score += 6 * len(want_occ & occ)                      # exact occasion membership dominates
            score += 2 * len(related & occ)                       # related occasions, lower weight
            if it["fabric"].lower() in fabrics or any(f in it["fabric"].lower() for f in fabrics): score += 2 * len(fabrics)
            score += 2 * sum(1 for c in categories if c in it["category"].lower())
            score += sum(1 for c in colors if any(c in x["name"].lower() for x in it["colors"]))
            if wx and wx in occ: score += 1
            # product-type / name match from free speech ("handbag", "tracksuit", "sunglasses", "navy")
            for q in qwords:
                if any(_tok_match(q, tk) for tk in itoks):
                    score += 4
            if max_price and it["price"] <= max_price: score += 1
            if score > 0:
                matches.append((score, it))

        # if a product was clearly named but nothing matched in this gender (e.g. "handbags" while
        # browsing men's), search the product across ALL genders instead of showing unrelated items
        if not matches and qwords:
            for it in self.catalog:
                itoks = (set(it["name"].lower().split()) | {it["category"].lower()}
                         | set(it["fabric"].lower().split()) | {c["name"].lower() for c in it["colors"]})
                sc = 4 * sum(1 for q in qwords if any(_tok_match(q, tk) for tk in itoks))
                if sc > 0:
                    matches.append((sc, it))

        matches.sort(key=lambda x: (-x[0], x[1]["price"]))
        cards = [self._card(it) for _, it in matches] or [self._card(it) for it in pool[:12]]
        if not g:  # mixed: interleave women/men so neither dominates the top
            w = [c for c in cards if c.get("gender") == "women"]
            m = [c for c in cards if c.get("gender") == "men"]
            cards = [x for pair in zip(w, m) for x in pair] + w[len(m):] + m[len(w):]
        self._last_visible = [c["id"] for c in cards]
        self._ui("filter", sku_ids=[c["id"] for c in cards],
                 criteria={"occasion": occasion or (query if want_occ else None), "gender": g or "all",
                           "fabrics": fabrics or None, "colors": colors or None,
                           "categories": categories or None, "weather": weather})
        # Keep the tool RESULT tiny — the full catalog already went to the UI via the ui_command.
        # A large result makes the live avatar choke and stop speaking after the tool call.
        return {"shown": len(cards), "examples": [c["name"] for c in cards[:4]]}

    # ---------------- VOICE: drive EVERY action from the shopper's transcript ----------------
    # The Live Avatar model can't call tools mid-conversation, so we parse what the shopper SAYS
    # and execute the matching action ourselves. handle_speech() is the single entry point.
    def handle_speech(self, text: str) -> Optional[str]:
        if not text or not text.strip():
            return None
        t = " " + text.lower().strip() + " "

        # --- my orders / order history (note: not "my order" — that clashes with "place my order") ---
        if any(p in t for p in ("my orders", "order history", "past orders", "previous orders", "recent orders",
                                "last order", "recent order", "track my order", "track order", "show my orders",
                                "view orders", "order status")):
            self.t_view_orders(); return "orders"

        # --- place order / pay → ALWAYS open the secure CVV popup; NEVER accept a spoken CVV ---
        # (security: the CVV must be entered by the shopper in the popup, never said to the stylist.)
        if any(p in t for p in ("place the order", "place my order", "place order", "confirm the order",
                                "complete the order", "complete my order", "pay now", "make the payment",
                                "ready to pay", "proceed to pay", "cvv", "security code")):
            self.t_request_payment(); return "payment"

        # --- checkout / payment / address ---
        if any(p in t for p in ("check out", "checkout", "proceed to checkout", "let's buy", "buy now",
                                "i'll buy", "i want to buy", "place an order")):
            self.t_open_checkout(); return "checkout"
        if (any(p in t for p in ("proceed to payment", "go to payment", "use my card", "pay with my card",
                                 "pay with card", "pay by card", "pay using", "card payment", "with my card",
                                 "ready to pay", "make payment", "proceed to pay")) or ("pay" in t and "card" in t)):
            self.t_request_payment(); return "payment"
        if ("address" in t or any(p in t for p in ("deliver here", "deliver to", "ship to", "same address",
                                "that's correct", "thats correct", "deliver it here", "deliver to my home"))):
            self.t_confirm_address(); return "address"

        # --- promo code ---
        if any(p in t for p in ("promo", "coupon", "discount code", " code ", "offer code", "apply ")):
            code = self._extract_promo(t)
            if code:
                self.t_apply_promo(code=code); return "promo"

        # --- virtual try-on ---
        if any(p in t for p in ("try on", "try-on", "tryon", "try it on", "try this on", "on me", "on myself",
                                "see it on me", "show me wearing", "wear it", "how it looks on me",
                                "look on me", "show me on me", "virtual try")):
            self.t_generate_virtual_tryon(); return "vto"

        # --- remove from cart ---
        if any(p in t for p in ("remove", "take out", "take it off", "get rid of", "delete", "drop the")):
            it = self._resolve_item(t)
            if it:
                self.t_remove_from_cart(sku_id=it["id"]); return "remove"

        # --- complete the look (add matching bottom + footwear + accessory in one go) ---
        if (("complete" in t and "look" in t)
                or any(p in t for p in ("whole look", "full look", "entire look", "rest of the look",
                                        "finish the look", "complete the outfit", "style the full"))
                or ("matching" in t and any(w in t for w in ("pant", "trouser", "short", "shoe", "footwear",
                                            "sandal", "boot", "bottom", "accessor", "umbrella", "look")))):
            self.t_complete_look(); return "complete"

        # --- add to cart ---
        if any(p in t for p in ("add ", "i'll take", "i will take", "add it", "add this", "add that",
                                "to my cart", "to the cart", "to my bag", "to the bag", "put it in",
                                "i want this", "i want the", "i'll get", "get me this")):
            it = self._resolve_item(t)
            if it:
                self.t_add_to_cart(sku_id=it["id"]); return "add"

        # --- size query ---
        if "size" in t:
            it = self._resolve_item(t)
            if it:
                self.t_recommend_size(sku_id=it["id"]); return "size"

        # --- otherwise: a styling request → filter the catalog ---
        return "filter" if self.filter_from_speech(text) else None

    def filter_from_speech(self, text: str) -> bool:
        t = " " + (text or "").lower() + " "
        # filter if they named an occasion OR any catalog word (category/product/colour/fabric)
        named = any(any(_tok_match(q, v) for v in self._vocab) for q in _qwords(text))
        if not _occ_tokens(t) and not named and not any(w in t for w in (
                "wear", "outfit", "dress", "look", "style", "shoes", "festive", "casual", "show me")):
            return False  # not a styling request — let the avatar just chat
        self.t_filter_catalog(query=text, gender=self._gender_from_text(t))
        return True

    def _gender_from_text(self, t: str) -> Optional[str]:
        if any(w in t for w in (" men", " man ", " him", " his ", "husband", "boyfriend", "brother",
                                "father", " dad", " son", "groom", "sherwani", "bandhgala", "nehru", "tuxedo")):
            return "men"
        if any(w in t for w in (" women", " woman", " her ", " she ", "wife", "girlfriend", "sister",
                                "mother", " mom", "bride", "lehenga", "saree", "anarkali", "gown")):
            return "women"
        return None

    def _extract_promo(self, t: str) -> Optional[str]:
        squashed = re.sub(r"\s", "", t)
        for code in self.promos:
            letters = "".join(c for c in code.lower() if c.isalpha())
            if code.lower() in squashed or (letters and letters in squashed):
                return code
        return None

    _DEICTIC = ("this", "that", " it ", "these", "those", "first", " one ", "ones", "the same", "top")

    def _score_item(self, it: dict, t: str) -> int:
        """Weighted match of an item against the shopper's WORDS (whole-word, plural-aware via _tok_match):
        colour & product-name count most, then category, then fabric. Word-level matching avoids false hits
        like fabric "art" matching "c-art" in "cart"."""
        words = [w for w in re.findall(r"[a-z]+", t.lower()) if len(w) > 2]

        def hit(tok: str) -> bool:
            return len(tok) > 2 and any(_tok_match(tok, w) for w in words)

        score = 0
        for c in it["colors"]:                                   # colour ("the navy one")
            if any(hit(w) for w in c["name"].lower().split()):
                score += 3
        for w in it["name"].lower().split():                     # product name words
            if hit(w):
                score += 2
        for w in it["category"].lower().split():                 # category ("umbrella", "raincoat")
            if hit(w):
                score += 2
        for w in it["fabric"].lower().split():                   # fabric
            if hit(w):
                score += 1
        return score

    def _resolve_item(self, t: str) -> Optional[dict]:
        """Best-match a catalog item from the shopper's words. Prefer what's on screen, but if they clearly
        named a product that isn't visible (e.g. 'add an umbrella' after browsing raincoats) search the WHOLE
        catalog rather than silently grabbing the first visible item."""
        t = " " + t.lower() + " "
        onscreen = [self.by_id[i] for i in self._last_visible if i in self.by_id]
        full = self.catalog
        if self.user_gender in ("women", "men"):
            full = [it for it in full if it.get("gender") == self.user_gender] or full
            onscreen = [it for it in onscreen if it.get("gender") == self.user_gender] or onscreen

        def best(pool):
            b, bs = None, 0
            for it in pool:
                s = self._score_item(it, t)
                if s > bs:
                    b, bs = it, s
            return b, bs

        b, bs = best(onscreen)                  # 1) something on screen matches the words
        if bs > 0:
            return b
        b, bs = best(full)                      # 2) a named product that isn't on screen
        if bs > 0:
            return b
        if any(d in t for d in self._DEICTIC) and onscreen:   # 3) deictic ("add this") → only if something IS shown
            return onscreen[0]
        return None   # nothing clearly named, and no on-screen referent → DON'T add a random item

    def t_highlight_products(self, sku_ids=None, **_) -> dict:
        sku_ids = [s for s in (sku_ids or []) if s in self.by_id]
        self._ui("highlight", sku_ids=sku_ids)
        return {"highlighted": sku_ids}

    def t_recommend_size(self, sku_id=None, **_) -> dict:
        s = self.suggest_size(sku_id)
        if "error" not in s:
            self._ui("sizing", **s, name=self.by_id[sku_id]["name"], image=self.by_id[sku_id]["image"])
        return s

    def t_add_to_cart(self, sku_id=None, size=None, **_) -> dict:
        it = self.by_id.get(sku_id)
        if not it:
            return {"error": f"unknown sku {sku_id}"}
        # idempotent: an item is in the bag at most once (never silently bump quantity / add twice)
        if any(line["sku_id"] == sku_id for line in self.cart):
            self._ui("toast", text=f"{it['name']} is already in your bag")
            return {"already_in_cart": True, "name": it["name"], "cart": self.cart_view()}
        from_profile = not size           # no size given → use the shopper's saved size
        if not size:
            size = self.suggest_size(sku_id)["suggested_size"]
        self.cart.append({"sku_id": sku_id, "size": size, "qty": 1})
        self._ui("cart_update", **self.cart_view())
        self._ui("highlight", sku_ids=[sku_id])
        # subtly note it's their saved/usual size when we picked it from the profile
        is_free = "Free" in it.get("sizes", [])
        toast = f"Added {it['name']} — size {size}" + ("  · your usual fit" if from_profile and not is_free else "")
        self._ui("toast", text=toast)
        return {"added": it["name"], "size": size, "from_profile": from_profile, "cart": self.cart_view()}

    def _slot(self, it: dict) -> str:
        """Coarse wardrobe slot for an item: top / bottom / footwear / accessory."""
        c = it["category"]
        if c == "Footwear":
            return "footwear"
        if c == "Accessory":
            return "accessory"
        if set(it["sizes"]) & {"26", "28", "30", "32", "34", "36", "38"}:
            return "bottom"
        return "top"

    def t_complete_look(self, **_) -> dict:
        """Add coordinated pieces to finish the outfit in ONE step — the matching bottom, footwear and an
        accessory that share the anchor piece's occasions (e.g. rain jacket → rain pants + waterproof shoes
        + umbrella). Keeps the demo to a few turns."""
        cart_items = [self.by_id[l["sku_id"]] for l in self.cart]
        # build the look around the piece the shopper actually CHOSE (a top in the bag) — never guess from the
        # grid (that's what added the wrong jacket). If nothing's in the bag yet, ask them to pick first.
        anchor = next((it for it in reversed(cart_items) if self._slot(it) == "top"), None)
        if not anchor:
            self._ui("toast", text="Pick a piece you like first — then I'll complete the look around it")
            return {"error": "no main piece in the bag yet"}
        g = anchor.get("gender")
        occ = set(anchor["occasions"])
        have = {self._slot(it) for it in cart_items}
        in_cart = {l["sku_id"] for l in self.cart}
        added = []
        # add the matching bottom + footwear (accessories like umbrellas are intentionally NOT auto-added —
        # they render unreliably in try-on and clutter the look)
        for slot in ("bottom", "footwear"):
            if slot in have:
                continue
            cands = [it for it in self.catalog if it.get("gender") == g and self._slot(it) == slot
                     and it["id"] != anchor["id"] and it["id"] not in in_cart and (occ & set(it["occasions"]))]
            cands.sort(key=lambda it: (len(occ & set(it["occasions"])), it["price"]), reverse=True)
            if cands:
                self.t_add_to_cart(sku_id=cands[0]["id"])
                added.append(cands[0]["name"])
        self._ui("toast", text="Completed your look ✨")
        return {"anchor": anchor["name"], "added": added}

    def t_remove_from_cart(self, sku_id=None, name=None, index=None, **_) -> dict:
        target = None
        if sku_id and any(l["sku_id"] == sku_id for l in self.cart):
            target = next(l for l in self.cart if l["sku_id"] == sku_id)
        elif index is not None and 0 <= int(index) < len(self.cart):
            target = self.cart[int(index)]
        elif name:
            for l in self.cart:
                if name.lower() in self.by_id[l["sku_id"]]["name"].lower():
                    target = l; break
        if not target:
            return {"error": "item not found in cart"}
        self.cart.remove(target)
        removed = self.by_id[target["sku_id"]]["name"]
        self._ui("cart_update", **self.cart_view())
        self._ui("toast", text=f"Removed {removed}")
        return {"removed": removed, "cart": self.cart_view()}

    def t_view_cart(self, **_) -> dict:
        self._ui("cart_open")
        return self.cart_view()

    def t_generate_virtual_tryon(self, sku_ids=None, context=None, **_) -> dict:
        sku_ids = [s for s in (sku_ids or []) if s in self.by_id]
        if not sku_ids:
            # default to the cart as a COMPLETE look — apparel/accessories first, then footwear, so the
            # try-on shows head-to-toe (e.g. rain jacket + rain pants + waterproof shoes).
            cart_ids = [l["sku_id"] for l in self.cart]
            apparel = [s for s in cart_ids if self.by_id[s]["category"] not in ("Footwear", "Accessory")]
            footwear = [s for s in cart_ids if self.by_id[s]["category"] == "Footwear"]
            sku_ids = (apparel[:3] + footwear[:1])[:4]
        if not sku_ids:
            return {"error": "Nothing to try on yet — add an outfit to the cart first."}
        names = [self.by_id[s]["name"] for s in sku_ids]
        self._ui("vto_start", sku_ids=sku_ids, context=context or "studio",
                 names=names)
        # run VTO out-of-band so the turn can complete with a spoken acknowledgement
        if self._send:
            asyncio.create_task(self._run_vto(sku_ids, context))
        return {"status": "generating", "items": names,
                "note": "Creating your virtual try-on now; it will appear in a few seconds."}

    async def _run_vto(self, sku_ids, context):
        from . import vto
        try:
            data_url, caption = await asyncio.to_thread(vto.generate_vto, self, sku_ids, context)
            await self._send({"type": "ui_command", "command": "vto_result",
                              "args": {"image_url": data_url, "caption": caption, "sku_ids": sku_ids}})
        except Exception as e:  # noqa
            await self._send({"type": "ui_command", "command": "vto_error",
                              "args": {"message": str(e)[:200]}})

    def _review_data(self, promo_error: str | None = None) -> dict:
        """Consolidated checkout-review payload: items + totals + applied promo + saved address + saved card.
        cart_view() already carries `promo` and `discount`, so the UI can show the applied state vs the input."""
        cv = self.cart_view()
        pay = self.profile["payment"]
        d = {**cv, "address": self.profile["default_address"], "name": self.profile["name"],
             "payment": {"last4": pay["last4"], "type": pay["type"], "expiry": pay["expiry"]}}
        if promo_error:
            d["promo_error"] = promo_error
        return d

    def t_open_checkout(self, **_) -> dict:
        cv = self.cart_view()
        if not cv["items"]:
            return {"error": "cart is empty"}
        self._ui("checkout", step="review", data=self._review_data())
        return {"step": "review", **cv}

    def t_apply_promo(self, code=None, **_) -> dict:
        code = (code or "").upper().strip()
        if code not in self.promos:
            # re-show the consolidated review with an inline error (input stays visible to retry)
            self._ui("checkout", step="review", data=self._review_data(promo_error=code or "that code"))
            return {"valid": False, "message": f"{code} is not a valid code"}
        self.applied_promo = code
        cv = self.cart_view()
        # re-show review → now `promo` is set, so the UI swaps the input for an "applied" state
        self._ui("checkout", step="review", data=self._review_data())
        return {"valid": True, "code": code, "discount": cv["discount"], "total": cv["total"]}

    def t_confirm_address(self, **_) -> dict:
        # address is already shown in the consolidated review; re-affirm it there
        self._ui("checkout", step="review", data=self._review_data())
        return {"address": self.profile["default_address"], "name": self.profile["name"]}

    def t_request_payment(self, **_) -> dict:
        pay = self.profile["payment"]
        cv = self.cart_view()
        self._ui("checkout", step="payment",
                 data={"last4": pay["last4"], "type": pay["type"], "expiry": pay["expiry"],
                       "total": cv["total"], "discount": cv["discount"], "promo": cv["promo"]})
        return {"card": f"{pay['type']} ending {pay['last4']}", "need": "3-digit CVV"}

    def orders_view(self) -> list[dict]:
        return list(reversed(self.orders))   # most-recent first

    def t_view_orders(self, **_) -> dict:
        self._ui("orders_open", orders=self.orders_view())
        return {"count": len(self.orders),
                "latest": self.orders[-1]["order_id"] if self.orders else None}

    def t_place_order(self, cvv=None, **_) -> dict:
        # NOTE: CVV is never logged or stored — used only to authorise this mock transaction, and it only ever
        # reaches the backend via the secure payment popup (never the stylist/LLM).
        if not (cvv and str(cvv).isdigit() and len(str(cvv)) == 3):
            return {"error": "Enter your 3-digit CVV in the secure popup to authorise."}
        cv = self.cart_view()
        if not cv["items"]:
            return {"error": "cart is empty"}
        order_id = "CD" + str(abs(hash(tuple((l["sku_id"], l.get("size")) for l in self.cart))) % 900000 + 100000)
        order = {"order_id": order_id, "total": cv["total"], "subtotal": cv["subtotal"],
                 "discount": cv["discount"], "eta": "3–5 days", "items": cv["items"],
                 "address": self.profile["default_address"], "placed": "Just now"}
        self.orders.append(order)
        self._ui("checkout", step="success", data=order)
        # clear the bag + reflect it in the UI (drawer + badge), and refresh My Orders
        self.cart = []
        self.applied_promo = None
        self._ui("cart_update", **self.cart_view())
        self._ui("orders_update", orders=self.orders_view())
        return {"order_id": order_id, "status": "placed", "total": cv["total"]}


# tool name -> CommerceSession method
HANDLERS = {
    "filter_catalog": "t_filter_catalog",
    "highlight_products": "t_highlight_products",
    "recommend_size": "t_recommend_size",
    "add_to_cart": "t_add_to_cart",
    "complete_look": "t_complete_look",
    "remove_from_cart": "t_remove_from_cart",
    "view_cart": "t_view_cart",
    "generate_virtual_tryon": "t_generate_virtual_tryon",
    "open_checkout": "t_open_checkout",
    "apply_promo": "t_apply_promo",
    "confirm_address": "t_confirm_address",
    "request_payment": "t_request_payment",
    "place_order": "t_place_order",
    "view_orders": "t_view_orders",
}
