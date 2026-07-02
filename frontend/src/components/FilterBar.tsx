import { useMemo } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useStore } from "../store";

const SORTS = [
  { v: "featured", l: "Featured" },
  { v: "price-asc", l: "Price: Low to High" },
  { v: "price-desc", l: "Price: High to Low" },
  { v: "newest", l: "Newest" },
];

export default function FilterBar() {
  const { catalog, filter, setFilter, visibleIds, selectedAvatar, set } = useStore();

  const pool = useMemo(
    () => catalog.filter((p) => filter.gender === "all" || p.gender === filter.gender),
    [catalog, filter.gender]
  );
  const categories = useMemo(
    () => ["all", ...Array.from(new Set(pool.map((p) => p.category))).sort()],
    [pool]
  );
  const occasions = useMemo(
    () => ["all", ...Array.from(new Set(pool.flatMap((p) => p.occasions))).sort()],
    [pool]
  );

  const aiActive = !!visibleIds;

  return (
    <div className="sticky top-0 z-20 -mx-1 px-1 pt-1 pb-3 bg-[#FAF7FB]/80 backdrop-blur-md">
      {/* search + sort row */}
      <div className="flex items-center gap-2 mb-2.5">
        <div className="flex-1 flex items-center gap-2 bg-white rounded-full border border-stone-200 px-3.5 h-10 focus-within:border-brand-purple/50 transition">
          <Search size={16} className="text-stone-400" />
          <input
            value={filter.query}
            onChange={(e) => setFilter({ query: e.target.value })}
            placeholder="Search kurtas, sherwanis, sneakers…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-stone-400"
          />
          {filter.query && (
            <button onClick={() => setFilter({ query: "" })} aria-label="Clear search" className="text-stone-400 hover:text-brand-ink">
              <X size={15} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 bg-white rounded-full border border-stone-200 px-3 h-10">
          <SlidersHorizontal size={15} className="text-stone-400" />
          <select
            value={filter.sort}
            onChange={(e) => setFilter({ sort: e.target.value })}
            className="bg-transparent text-sm outline-none cursor-pointer pr-1 text-brand-ink">
            {SORTS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
          </select>
        </div>
      </div>

      {/* category chips */}
      <div className="flex items-center gap-2 overflow-x-auto scroll-thin pb-1 -mb-1">
        {categories.map((c) => (
          <button key={c} onClick={() => setFilter({ category: c })}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[13px] font-medium border transition whitespace-nowrap
              ${filter.category === c && !aiActive
                ? "bg-brand-ink text-white border-transparent"
                : "bg-white text-stone-600 border-stone-200 hover:border-brand-purple/40 hover:text-brand-ink"}`}>
            {c === "all" ? "All" : c}
          </button>
        ))}
        {occasions.length > 1 && (
          <select
            value={filter.occasion}
            onChange={(e) => setFilter({ occasion: e.target.value })}
            className={`shrink-0 ml-1 px-3 py-1.5 rounded-full text-[13px] font-medium border cursor-pointer capitalize
              ${filter.occasion !== "all" && !aiActive ? "bg-violet-50 text-brand-purple border-violet-200" : "bg-white text-stone-600 border-stone-200"}`}>
            <option value="all">Any occasion</option>
            {occasions.filter((o) => o !== "all").map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        )}
        {aiActive && (
          <button onClick={() => set({ visibleIds: null, criteria: null })}
            className="shrink-0 ml-1 px-3 py-1.5 rounded-full text-[13px] font-semibold bg-brand-gradient text-white">
            Clear {selectedAvatar}'s edit ✕
          </button>
        )}
      </div>
    </div>
  );
}
