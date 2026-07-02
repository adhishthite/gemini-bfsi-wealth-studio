import { Plus, Sparkles } from "lucide-react";
import type { Product } from "../types";
import { asset, rupee, tagStyle } from "../lib";
import { sendAction } from "../ws";
import { useStore } from "../store";

export default function ProductCard({ product, highlighted }: { product: Product; highlighted: boolean }) {
  const selectedAvatar = useStore((s) => s.selectedAvatar);
  const discount = product.mrp ? Math.round((1 - product.price / product.mrp) * 100) : 0;
  return (
    <div
      className={`group relative rounded-xl2 bg-white border transition-all duration-300 overflow-hidden
        ${highlighted
          ? "border-transparent ring-2 ring-brand-pink shadow-glass -translate-y-1"
          : "border-stone-200/80 shadow-soft hover:-translate-y-1 hover:shadow-lift"}`}
    >
      {highlighted && (
        <div className="absolute top-2 left-2 z-10 chip bg-brand-gradient text-white shadow animate-scale-in">
          <Sparkles size={12} /> {selectedAvatar}'s pick
        </div>
      )}
      <div className="relative aspect-[4/5] overflow-hidden bg-stone-100">
        <img src={asset(product.image)} alt={product.name} loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          {product.tags.map((t) => (
            <span key={t} className={`chip ${tagStyle(t)} shadow-sm`}>{t}</span>
          ))}
        </div>
      </div>
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold text-brand-ink leading-tight truncate">{product.name}</h3>
            <p className="text-xs text-stone-500 mt-0.5">{product.fabric}</p>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          {product.colors.map((c) => (
            <span key={c.name} title={c.name}
              className="h-4 w-4 rounded-full border border-black/10 shadow-inner"
              style={{ background: c.hex }} />
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[15px] font-bold text-brand-ink tabular-nums">{rupee(product.price)}</span>
            {discount > 0 && (
              <>
                <span className="text-xs text-stone-400 line-through tabular-nums">{rupee(product.mrp)}</span>
                <span className="text-xs font-semibold text-emerald-600">{discount}% off</span>
              </>
            )}
          </div>
          <button
            onClick={() => sendAction("recommend_size", { sku_id: product.id })}
            aria-label={`Add ${product.name} to cart`}
            className="grid place-items-center h-9 w-9 rounded-full bg-brand-ink text-white
              transition-all duration-200 hover:bg-brand-purple active:scale-90">
            <Plus size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
