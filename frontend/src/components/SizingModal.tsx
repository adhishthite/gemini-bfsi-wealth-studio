import { Ruler, ShieldCheck } from "lucide-react";
import Modal from "./Modal";
import { useStore } from "../store";
import { asset } from "../lib";
import { sendAction } from "../ws";

export default function SizingModal() {
  const { sizing, catalog, set } = useStore();
  if (!sizing) return null;
  const product = catalog.find((p) => p.id === sizing.sku_id);
  const close = () => set({ sizing: null });

  return (
    <Modal open={!!sizing} onClose={close} title="Find your fit" maxW="max-w-md">
      <div className="px-6 pb-6">
        <div className="flex gap-4">
          <img src={asset(sizing.image)} alt={sizing.name}
            className="h-28 w-22 rounded-xl object-cover bg-stone-100 shadow-soft" />
          <div className="flex-1">
            <h4 className="font-semibold text-brand-ink leading-tight">{sizing.name}</h4>
            <div className="mt-3 rounded-2xl bg-violet-50 border border-violet-100 p-3">
              <p className="text-xs text-brand-purple font-semibold flex items-center gap-1.5">
                <Ruler size={13} /> Smart size recommendation
              </p>
              <p className="mt-1.5 text-2xl font-bold brand-text">{sizing.suggested_size}</p>
              <p className="mt-1 text-xs text-stone-600 leading-snug">{sizing.rationale}</p>
            </div>
          </div>
        </div>

        {product && (
          <div className="mt-4">
            <p className="text-xs text-stone-500 mb-2">Choose a size</p>
            <div className="flex flex-wrap gap-2">
              {product.sizes?.map((sz: string) => (
                <button key={sz}
                  onClick={() => { sendAction("add_to_cart", { sku_id: sizing.sku_id, size: sz }); close(); }}
                  className={`min-w-[3rem] rounded-xl px-3 py-2 text-sm font-semibold border transition-all active:scale-95
                    ${sz === sizing.suggested_size
                      ? "bg-brand-gradient text-white border-transparent shadow-glass"
                      : "bg-white text-brand-ink border-stone-200 hover:border-brand-purple/50"}`}>
                  {sz}
                </button>
              ))}
            </div>
          </div>
        )}

        {sizing.returns_rate != null && sizing.returns_rate > 0.12 && (
          <p className="mt-4 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 flex items-center gap-1.5">
            <ShieldCheck size={13} /> This style runs slightly large — we've factored that into your size.
          </p>
        )}

        <button onClick={() => { sendAction("add_to_cart", { sku_id: sizing.sku_id, size: sizing.suggested_size }); close(); }}
          className="btn-primary w-full mt-5">
          Add size {sizing.suggested_size} to bag
        </button>
      </div>
    </Modal>
  );
}
