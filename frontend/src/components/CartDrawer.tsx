import { X, ShoppingBag, Trash2, Wand2, CreditCard } from "lucide-react";
import { useStore } from "../store";
import { asset, rupee } from "../lib";
import { sendUserText, sendAction } from "../ws";

export default function CartDrawer() {
  const { cart, cartOpen, selectedAvatar, set } = useStore();
  const close = () => set({ cartOpen: false });
  const count = cart.items.reduce((n, i) => n + i.qty, 0);

  return (
    <>
      {cartOpen && <div className="fixed inset-0 z-[90] bg-brand-ink/40 backdrop-blur-sm animate-[fade-up_.2s]" onClick={close} />}
      <aside
        className={`fixed top-0 right-0 z-[95] h-full w-[min(420px,92vw)] glass shadow-lift
          flex flex-col transition-transform duration-300 ${cartOpen ? "translate-x-0" : "translate-x-full"}`}
        aria-hidden={!cartOpen}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/60">
          <h3 className="text-lg font-bold text-brand-ink flex items-center gap-2">
            <ShoppingBag size={19} /> Your Bag
            <span className="chip bg-brand-gradient text-white">{count}</span>
          </h3>
          <button onClick={close} aria-label="Close cart" className="rounded-full p-1.5 text-brand-ink/50 hover:bg-brand-ink/5">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scroll-thin p-4 space-y-3">
          {cart.items.length === 0 && (
            <div className="grid place-items-center h-full text-center text-stone-500 gap-2">
              <ShoppingBag size={40} className="text-stone-300" />
              <p className="text-sm">Your bag is empty.<br />Ask {selectedAvatar} to style a look.</p>
            </div>
          )}
          {cart.items.map((it) => (
            <div key={it.sku_id + it.size} className="flex gap-3 bg-white rounded-2xl p-2.5 border border-stone-200/80 shadow-soft animate-fade-up">
              <img src={asset(it.image)} alt={it.name} className="h-20 w-16 rounded-xl object-cover bg-stone-100" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-brand-ink leading-tight">{it.name}</h4>
                <p className="text-xs text-stone-500 mt-0.5">Size {it.size} · Qty {it.qty}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-sm font-bold text-brand-ink tabular-nums">{rupee(it.price * it.qty)}</span>
                  <button onClick={() => sendAction("remove_from_cart", { sku_id: it.sku_id })}
                    aria-label={`Remove ${it.name}`}
                    className="text-stone-400 hover:text-red-500 transition p-1"><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {cart.items.length > 0 && (
          <div className="border-t border-white/60 p-4 space-y-3 bg-white/50">
            <div className="space-y-1 text-sm">
              <Row label="Subtotal" value={rupee(cart.subtotal)} />
              {cart.discount > 0 && (
                <Row label={`Discount${cart.promo ? ` (${cart.promo})` : ""}`} value={`– ${rupee(cart.discount)}`} green />
              )}
              <div className="flex justify-between pt-1.5 border-t border-stone-200 font-bold text-brand-ink">
                <span>Total</span><span className="tabular-nums">{rupee(cart.total)}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => sendUserText("Show me this outfit on me")} className="btn-ghost">
                <Wand2 size={15} /> Try-On
              </button>
              <button onClick={() => sendAction("open_checkout")} className="btn-primary">
                <CreditCard size={15} /> Checkout
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

function Row({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <div className="flex justify-between text-stone-600">
      <span>{label}</span>
      <span className={`tabular-nums ${green ? "text-emerald-600 font-medium" : ""}`}>{value}</span>
    </div>
  );
}
