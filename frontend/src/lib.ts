export const AVATARS = [
	"Kira",
	"Ingrid",
	"Vera",
	"Jay",
	"Paul",
	"Sam",
] as const;
export type AvatarName = (typeof AVATARS)[number];
export const avatarImg = (name: string) => asset(`assets/avatars/${name}.png`);

// each avatar's gender — drives the stylist's voice/gender AND the shopper's default gender
export const AVATAR_GENDER: Record<string, "women" | "men"> = {
	Kira: "women",
	Ingrid: "women",
	Vera: "women",
	Carmen: "women",
	Piper: "women",
	Jay: "men",
	Paul: "men",
	Sam: "men",
	Kai: "men",
	Ben: "men",
	Leo: "men",
};
export const avatarGender = (name: string): "women" | "men" =>
	AVATAR_GENDER[name] ?? "women";

export const asset = (path: string) => "/" + path.replace(/^\//, "");

/* ==========================================================================
   Numerals — the hero material of this interface.

   Indian digit grouping throughout (₹75,00,000 — lakh/crore, not thousands).
   Pair every one of these with a `.figure*` class so it renders as a lining,
   tabular figure.
   ========================================================================== */

/** Full precision, Indian grouping. ₹75,00,000 */
export const rupee = (n?: number | null) =>
	n == null || Number.isNaN(n)
		? ""
		: "₹" + Math.round(n).toLocaleString("en-IN");

/** Alias of `rupee`, named for how it reads at the call site. */
export const inr = rupee;

/**
 * Crore / lakh shorthand for hero figures. ₹4.2 Cr, ₹75.0 L, ₹48,000.
 * Returns the parts separately so the unit can be set in `.figure-unit`
 * beside a large `.figure-lg` value.
 */
export const inrParts = (
	n?: number | null,
): { value: string; unit: string } => {
	if (n == null || Number.isNaN(n)) return { value: "—", unit: "" };
	const abs = Math.abs(n);
	const sign = n < 0 ? "-" : "";
	if (abs >= 1e7)
		return {
			value: sign + "₹" + (abs / 1e7).toFixed(abs >= 1e8 ? 0 : 2),
			unit: "Cr",
		};
	if (abs >= 1e5)
		return {
			value: sign + "₹" + (abs / 1e5).toFixed(abs >= 1e6 ? 0 : 1),
			unit: "L",
		};
	if (abs >= 1e3)
		return {
			value: sign + "₹" + Math.round(abs).toLocaleString("en-IN"),
			unit: "",
		};
	return {
		value: sign + "₹" + Math.round(abs).toLocaleString("en-IN"),
		unit: "",
	};
};

/** Crore / lakh shorthand as a single string. ₹4.2 Cr */
export const inrCompact = (n?: number | null) => {
	const { value, unit } = inrParts(n);
	return unit ? `${value} ${unit}` : value;
};

/** 12.4% — always one decimal, always tabular. */
export const pct = (n?: number | null, digits = 1) =>
	n == null || Number.isNaN(n) ? "—" : `${n.toFixed(digits)}%`;

/** Signed percentage for deltas: +2.4% / -1.1%. No colour — sign only. */
export const pctDelta = (n?: number | null, digits = 1) =>
	n == null || Number.isNaN(n)
		? "—"
		: `${n > 0 ? "+" : ""}${n.toFixed(digits)}%`;
