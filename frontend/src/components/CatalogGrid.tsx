import { useMemo } from "react";
import { Sparkles, CloudRain } from "lucide-react";
import { useStore } from "../store";
import type { Product } from "../types";
import ProductCard from "./ProductCard";
import FilterBar from "./FilterBar";

// home/default ordering: lead with the LATEST collection (New), then bestsellers, then premium, then the rest
const freshRank = (p: Product) =>
  p.tags.includes("New") ? 0 : p.tags.includes("Bestseller") ? 1 : p.tags.includes("Premium") ? 2 : p.tags.length ? 3 : 4;

// heavy bridal/festive wear shouldn't lead the home page — keep the latest seasonal/western/everyday pieces up top
const HEAVY_FESTIVE_CATS = new Set([
  "Lehenga", "Saree", "Anarkali", "Sherwani", "Bandhgala", "Sharara Set", "Gown", "Tuxedo",
]);
const HEAVY_FESTIVE_OCC = ["wedding", "sangeet", "reception", "mehendi", "haldi"];
const isHeavyFestive = (p: Product) =>
  HEAVY_FESTIVE_CATS.has(p.category) || p.occasions.some((o) => HEAVY_FESTIVE_OCC.includes(o));
// composite home rank: freshness first, but push bridal/festive down within each freshness tier
const homeRank = (p: Product) => freshRank(p) * 2 + (isHeavyFestive(p) ? 1 : 0);

// keep neither gender dominating the top of the home grid
function interleaveGenders(list: Product[]) {
  const w = list.filter((p) => p.gender === "women");
  const m = list.filter((p) => p.gender === "men");
  const out: Product[] = [];
  for (let i = 0; i < Math.max(w.length, m.length); i++) {
    if (i < w.length) out.push(w[i]);
    if (i < m.length) out.push(m[i]);
  }
  return out;
}

export default function CatalogGrid() {
  const { catalog, visibleIds, highlightIds, criteria, filter, selectedAvatar } = useStore();

  // pristine home = no AI edit, customer's default men's section, no extra filters → latest collection
  const pristine =
    !visibleIds && filter.gender === "men" && filter.category === "all" &&
    filter.occasion === "all" && !filter.query.trim() && filter.sort === "featured";

  const items = useMemo(() => {
    // AI edit takes precedence (ordered by relevance)
    if (visibleIds) {
      const order = new Map(visibleIds.map((id, i) => [id, i]));
      return catalog.filter((p) => order.has(p.id)).sort((a, b) => order.get(a.id)! - order.get(b.id)!);
    }
    // otherwise apply the manual filters
    let list = catalog.filter((p) => {
      if (filter.gender !== "all" && p.gender !== filter.gender) return false;
      if (filter.category !== "all" && p.category !== filter.category) return false;
      if (filter.occasion !== "all" && !p.occasions.includes(filter.occasion)) return false;
      if (filter.query.trim()) {
        const q = filter.query.toLowerCase();
        const hay = `${p.name} ${p.category} ${p.fabric} ${p.occasions.join(" ")} ${p.colors.map((c) => c.name).join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    switch (filter.sort) {
      case "price-asc": list = [...list].sort((a, b) => a.price - b.price); break;
      case "price-desc": list = [...list].sort((a, b) => b.price - a.price); break;
      case "newest": list = [...list].sort((a, b) => Number(b.tags.includes("New")) - Number(a.tags.includes("New"))); break;
      default: // "featured" → latest collection first, bridal/festive demoted
        list = [...list].sort((a, b) => homeRank(a) - homeRank(b));
        if (filter.gender === "all") list = interleaveGenders(list);
    }
    return list;
  }, [catalog, visibleIds, filter]);

  const crit = criteria || {};
  const chips = [crit.occasion, crit.weather, ...(crit.fabrics || []), ...(crit.colors || []), ...(crit.categories || [])].filter(Boolean);

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      <FilterBar />

      {/* Latest-collection hero (home only) */}
      {pristine && (
        <div className="relative overflow-hidden rounded-2xl bg-brand-gradient text-white px-5 sm:px-7 py-5 sm:py-6 mb-5 shadow-lift">
          <div className="relative z-10">
            <span className="chip bg-white/20 text-white backdrop-blur-sm"><Sparkles size={12} /> Just dropped</span>
            <h2 className="mt-2 text-2xl sm:text-[28px] leading-tight font-extrabold tracking-tight">The Latest Collection</h2>
            <p className="mt-1.5 text-[13px] sm:text-sm text-white/85 max-w-md">
              Fresh arrivals across ethnic, western & athleisure — plus our new
              <span className="inline-flex items-center gap-1 font-semibold"> <CloudRain size={13} /> monsoon-ready rainwear</span>,
              styled for the season ahead.
            </p>
          </div>
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute right-20 -bottom-8 h-28 w-28 rounded-full bg-white/10 blur-xl" />
        </div>
      )}

      <div className="flex items-center justify-between gap-3 px-1 pb-3">
        <div>
          <h2 className="text-xl font-bold text-brand-ink tracking-tight">
            {visibleIds ? `Styled for you by ${selectedAvatar}` : pristine ? "New In" : "The Edit"}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {visibleIds && chips.length > 0 ? (
              chips.map((c: string) => (
                <span key={c} className="chip bg-violet-50 text-brand-purple capitalize"><Sparkles size={11} /> {c}</span>
              ))
            ) : (
              <p className="text-sm text-stone-500">{pristine ? `${items.length} new & trending pieces` : `${items.length} pieces`}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-3.5 sm:gap-4">
        {items.map((p) => (
          <div key={p.id} className="animate-fade-up">
            <ProductCard product={p} highlighted={highlightIds.includes(p.id)} />
          </div>
        ))}
      </div>
      {items.length === 0 && (
        <div className="grid place-items-center py-24 text-center text-stone-500">
          <p className="text-sm">No pieces match these filters.<br />Try clearing a filter or ask {selectedAvatar} to restyle.</p>
        </div>
      )}
    </div>
  );
}
