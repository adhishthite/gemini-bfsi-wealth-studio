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

export const rupee = (n?: number) =>
	n == null ? "" : "₹" + n.toLocaleString("en-IN");

export const asset = (path: string) => "/" + path.replace(/^\//, "");

export const tagStyle = (tag: string): string => {
	const t = tag.toLowerCase();
	if (t.includes("bestseller")) return "bg-amber-100 text-amber-800";
	if (t.includes("new")) return "bg-emerald-100 text-emerald-800";
	if (t.includes("premium")) return "bg-violet-100 text-violet-800";
	if (t.includes("back")) return "bg-sky-100 text-sky-800";
	return "bg-stone-100 text-stone-700";
};
