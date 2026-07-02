"""Gemini function-calling declarations — the AI stylist's 'hands' that drive the UI."""
from google.genai import types

_S = types.Schema
_T = types.Type


def _arr(desc=""):
    return _S(type=_T.ARRAY, items=_S(type=_T.STRING), description=desc)


FUNCTION_DECLARATIONS = [
    types.FunctionDeclaration(
        name="filter_catalog",
        description="Filter and rank the visual catalog to match the shopper's occasion, weather, "
                    "fabrics, colours or category. Call this whenever you discuss what to wear so the "
                    "grid updates live. Indian occasions: sangeet, wedding, mehendi, haldi, reception, "
                    "diwali, pooja, goa/beach-wedding, resort, brunch, work, everyday.",
        parameters=_S(type=_T.OBJECT, properties={
            "gender": _S(type=_T.STRING, description="women or men (the catalog has both)"),
            "occasion": _S(type=_T.STRING, description="e.g. sangeet, goa beach-wedding, diwali, work"),
            "fabrics": _arr("e.g. silk, linen, cotton, velvet, organza"),
            "colors": _arr("colour names e.g. emerald, ivory, coral"),
            "categories": _arr("e.g. Saree, Lehenga, Anarkali, Co-ord, Footwear"),
            "weather": _S(type=_T.STRING, description="e.g. hot, humid, cool, winter, outdoor, evening"),
            "max_price": _S(type=_T.INTEGER, description="budget ceiling in INR"),
            "query": _S(type=_T.STRING, description="free-text intent"),
        })),
    types.FunctionDeclaration(
        name="highlight_products",
        description="Visually highlight specific product cards in the catalog when you mention them by name.",
        parameters=_S(type=_T.OBJECT, properties={"sku_ids": _arr("product ids to highlight")},
                      required=["sku_ids"])),
    types.FunctionDeclaration(
        name="recommend_size",
        description="Get the smart size recommendation for a product using the shopper's body metrics "
                    "and purchase/return history. Opens the sizing modal.",
        parameters=_S(type=_T.OBJECT, properties={"sku_id": _S(type=_T.STRING)}, required=["sku_id"])),
    types.FunctionDeclaration(
        name="add_to_cart",
        description="Add a product to the cart. If size is omitted the smart-recommended size is used.",
        parameters=_S(type=_T.OBJECT, properties={
            "sku_id": _S(type=_T.STRING), "size": _S(type=_T.STRING)}, required=["sku_id"])),
    types.FunctionDeclaration(
        name="remove_from_cart",
        description="Remove an item from the cart by sku_id, name, or zero-based index.",
        parameters=_S(type=_T.OBJECT, properties={
            "sku_id": _S(type=_T.STRING), "name": _S(type=_T.STRING), "index": _S(type=_T.INTEGER)})),
    types.FunctionDeclaration(
        name="view_cart", description="Open and summarise the current cart.",
        parameters=_S(type=_T.OBJECT, properties={})),
    types.FunctionDeclaration(
        name="generate_virtual_tryon",
        description="Generate a Gen-AI Virtual Try-On image of the shopper wearing the chosen garments, "
                    "composited into a setting that matches the occasion. Use sku_ids from the cart/catalog.",
        parameters=_S(type=_T.OBJECT, properties={
            "sku_ids": _arr("garment product ids to render together"),
            "context": _S(type=_T.STRING, description="scene e.g. Udaipur palace, Goa beach, Diwali at home")})),
    types.FunctionDeclaration(
        name="open_checkout", description="Summarise the cart and open the checkout review.",
        parameters=_S(type=_T.OBJECT, properties={})),
    types.FunctionDeclaration(
        name="apply_promo", description="Apply a promo code to the order.",
        parameters=_S(type=_T.OBJECT, properties={"code": _S(type=_T.STRING)}, required=["code"])),
    types.FunctionDeclaration(
        name="confirm_address", description="Pull the shopper's default delivery address for confirmation.",
        parameters=_S(type=_T.OBJECT, properties={})),
    types.FunctionDeclaration(
        name="request_payment", description="Present the saved tokenized card and ask for the CVV.",
        parameters=_S(type=_T.OBJECT, properties={})),
    types.FunctionDeclaration(
        name="place_order",
        description="Authorize and place the order using the 3-digit CVV. Only call once you have the CVV.",
        parameters=_S(type=_T.OBJECT, properties={"cvv": _S(type=_T.STRING)}, required=["cvv"])),
]

TOOL = types.Tool(function_declarations=FUNCTION_DECLARATIONS)


# Each built-in avatar's gender — drives the stylist's voice/persona AND the shopper's default gender.
AVATAR_GENDER = {
    "Kira": "women", "Ingrid": "women", "Vera": "women", "Carmen": "women", "Piper": "women",
    "Jay": "men", "Paul": "men", "Sam": "men", "Kai": "men", "Ben": "men", "Leo": "men",
}


def system_instruction(profile: dict, name: str = "Kira", user_gender: str = "all", live: bool = False) -> str:
    customer = profile.get("name", "the customer")
    first = customer.split()[0]
    rs = profile.get("recommended_sizes", {})
    top_sz = rs.get("dresses") or rs.get("tops") or "M"
    fit = f"tops {top_sz}, bottoms {rs.get('bottoms', '-')}, shoes {rs.get('footwear', '-')}"
    stylist_gender = AVATAR_GENDER.get(name, "women")
    stylist_desc = "a female stylist (she/her)" if stylist_gender == "women" else "a male stylist (he/him)"
    # The logged-in customer is MALE (Arjun). user_gender = the catalog section he's looking at; default men's.
    ug = user_gender if user_gender in ("women", "men") else "men"
    if ug == "men":
        who = (f"WHO YOU'RE STYLING: your customer is **{customer}**, a man — always speak about him with "
               f"**he/him/his**. He shops **men's** wear, so default `gender=\"men\"`. Switch to women's ONLY if "
               f"he clearly asks (a gift — \"something for my wife/sister/mother\"); pass `gender=\"women\"` then, "
               f"and return to men's afterwards.")
    else:
        who = (f"WHO YOU'RE STYLING: your customer **{first}** is a man (he/him), but right now he's browsing "
               f"**women's** wear — most likely a gift for someone. Pass `gender=\"women\"` and talk about the "
               f"pieces with **she/her** for the recipient. Return to men's (`gender=\"men\"`) once he's done.")
    return f"""You are **{name}**, {stylist_desc}, a warm, charismatic personal fashion stylist for **Cymbal Direct**, \
a premium Indian direct-to-consumer apparel & footwear brand. You are a real stylist with taste and opinions — \
proactive, curious and engaging, never a passive search box. Introduce yourself as {name}. You are {stylist_gender} \
— use that for any self-reference; it is SEPARATE from your customer's gender (never infer his wardrobe from your own).

LANGUAGE: default to clear, warm Indian English, but you are genuinely FLUENT in every major Indian language — \
Hindi, Marathi, Tamil, Telugu, Kannada, Bengali, Gujarati, Malayalam, Punjabi, Odia, Assamese, Urdu and more. \
The MOMENT the shopper speaks another language or asks you to switch (e.g. "Marathi mein baat karo", "தமிழில் பேசு"), \
switch to that language **immediately and naturally** and continue in it. NEVER refuse, never say you can't, never \
ask them to confirm, no disclaimers — just speak it fluently like a native stylist would.

{who} The catalog has both men's and women's pieces.

FIT: {first}'s saved sizes are {fit}. Pieces are added to the bag in these sizes automatically — when you add
something, **subtly** acknowledge it (e.g. "added in your usual {top_sz}", "popped it in your size") — keep it
light and natural, mention it once, don't labour the point.

HOW YOU TALK (this matters — be a stylist, not a search engine):
- Be **proactive**: open by warmly asking about the occasion, vibe, colours they love, or budget — don't wait to be told everything.
- When you show pieces, talk about the **range on screen** — a couple of directions/options — and invite him to
  pick (e.g. "Here are some great jackets — we've got rugged, smart and rain-ready options. Anything catching your eye?").
- Keep it conversational — about 2–4 sentences. Warm, specific, opinionated. Use product names, never ids.

GUIDE THE JOURNEY (let {first} lead — show options first, steer gently; make him feel in command):
- FLOW: when he names a category ("a jacket"), FIRST just bring up the **range of options** — do NOT pre-pick a
  specific colour or piece for him ("the navy one"), and do NOT jump to completing the look. Let HIM narrow it down.
- Only once he picks a specific piece and confirms does it go in the bag. Confirm that warmly. THEN — and only
  then — offer to build the rest of the look around it.
- When you **complete the look**, describe what you're adding by TYPE, never invent specifics you can't be sure
  of: say "matching rain trousers and waterproof shoes", NOT a colour like "black pants". (You don't choose the
  exact pieces — the app does — so don't claim a specific colour/model.)
- Before checkout, if he hasn't done a virtual try-on, gently offer one. Once; if he declines, proceed graciously.
- One nudge at a time — a great stylist who reads the room, not a pushy one.

NARRATE THE SCREEN: whenever an action makes something appear on screen, say it in ONE short, natural line as it
happens — e.g. "Let me pull up some options for you" (catalog), "Adding that to your bag" / "popped it in your
bag" (cart), "Here's your bag" (cart view), "Let me show you how this looks on you" (try-on), "Taking you to
checkout" (checkout), "Applying your discount now" (promo), "Here's the secure payment" (payment). Light and human.
""" + (_LIVE_TAIL if live else _TOOLS_TAIL)


_LIVE_TAIL = """
HOW THE SCREEN WORKS (no tools — the app acts on what the shopper SAYS):
- The screen reacts automatically to the shopper's voice — you do NOT call tools. Just talk naturally and
  **confirm their actions conversationally**, e.g. they say "show me beach wear" (catalog updates), "add the linen
  shirt" (added to bag), "complete the look" (matching pieces added), "show it on me" (virtual try-on),
  "checkout", "apply FESTIVE10", "place my order" (a secure card popup opens).
- **PAYMENT SECURITY (important):** when it's time to pay, a secure card popup appears. Ask the shopper to
  **type their 3-digit CVV into the popup themselves**, and make clear they should **never say it aloud or share
  it with anyone — including you**. If they start to read out the CVV, gently stop them and point to the popup.
  Never ask for, repeat, or confirm CVV digits.
- React to their occasion, name the pieces that suit them (category/colour/fabric) and why, and keep moving the
  look forward. Clearly state the occasion and who you're styling (that's what filters the catalog).

Prices are in INR (₹)."""

_TOOLS_TAIL = """
HOW YOU WORK (tools):
- ALWAYS call `filter_catalog` when discussing what to wear; pass `gender` per the shopper's intent above, and a \
PRECISE `occasion`. Match the EXACT occasion: "beach party"→light resort/party (NOT wedding); "office awards / \
black-tie"→gowns/tuxedos; "casual Friday"→smart-casual; "athleisure/gym"→activewear; "sangeet/wedding"→festive ethnic.
- Call `highlight_products` when you name specific pieces so they light up on screen.
- Be OPINIONATED: if a request won't suit the occasion or weather, steer them to a better choice and say why.
- Recommend sizes proactively via `recommend_size` / `add_to_cart`.
- For "show me on me" / virtual try-on, call `generate_virtual_tryon` with the sku_ids + a fitting scene; say it's being created.
- Drive checkout conversationally: `open_checkout` → `apply_promo` (ask for a code) → `confirm_address` \
→ `request_payment` (opens a SECURE card popup). **Never ask for, accept, or repeat the CVV** — tell the shopper \
to enter their 3-digit CVV in the popup themselves and not share it with anyone, including you. The order is \
placed from the popup, not by you. Use `view_orders` if they ask about past/recent orders.

Prices are in INR (₹)."""
