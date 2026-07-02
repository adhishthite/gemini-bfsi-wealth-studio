import { useState } from "react";
import { Check, MapPin, Tag, CreditCard, PartyPopper, Lock } from "lucide-react";
import Modal from "./Modal";
import { useStore } from "../store";
import { asset, rupee } from "../lib";
import { sendUserText, sendAction } from "../ws";
import type { CheckoutStep } from "../types";

const STEPS: { key: CheckoutStep; label: string }[] = [
  { key: "review", label: "Review" },
  { key: "promo", label: "Offer" },
  { key: "address", label: "Address" },
  { key: "payment", label: "Payment" },
  { key: "success", label: "Done" },
];

export default function CheckoutModal() {
  const { checkout, set } = useStore();
  const [promo, setPromo] = useState("");
  const [cvv, setCvv] = useState("");
  if (!checkout?.open) return null;
  const { step, data } = checkout;
  const close = () => set({ checkout: null });
  const idx = STEPS.findIndex((s) => s.key === step);

  return (
    <Modal open onClose={close} maxW="max-w-md" dismissable={step !== "success"}
      title={step === "success" ? undefined : "Checkout"}>
      <div className="px-6 pb-6">
        {step !== "success" && (
          <div className="flex items-center justify-between mb-5">
            {STEPS.slice(0, 4).map((s, i) => (
              <div key={s.key} className="flex items-center flex-1 last:flex-none">
                <div className={`flex items-center gap-1.5 ${i <= idx ? "text-brand-purple" : "text-stone-300"}`}>
                  <span className={`grid place-items-center h-6 w-6 rounded-full text-[11px] font-bold border-2
                    ${i < idx ? "bg-brand-gradient text-white border-transparent"
                      : i === idx ? "border-brand-purple text-brand-purple" : "border-stone-200"}`}>
                    {i < idx ? <Check size={12} /> : i + 1}
                  </span>
                  <span className="text-[11px] font-semibold hidden sm:block">{s.label}</span>
                </div>
                {i < 3 && <div className={`flex-1 h-[2px] mx-1.5 ${i < idx ? "bg-brand-purple/40" : "bg-stone-200"}`} />}
              </div>
            ))}
          </div>
        )}

        {step === "review" && (
          <div className="animate-fade-up">
            <div className="space-y-2 max-h-40 overflow-y-auto scroll-thin">
              {data.items?.map((it: any) => (
                <div key={it.sku_id + it.size} className="flex items-center gap-3">
                  <img src={asset(it.image)} className="h-12 w-10 rounded-lg object-cover bg-stone-100" alt="" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-ink truncate">{it.name}</p>
                    <p className="text-xs text-stone-500">Size {it.size} · Qty {it.qty}</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{rupee(it.price * it.qty)}</span>
                </div>
              ))}
            </div>
            <Totals data={data} />

            {/* saved details — already on file */}
            {data.address && (
              <div className="mt-3 grid gap-2">
                <div className="flex items-start gap-2 rounded-xl border border-stone-200 p-2.5">
                  <MapPin size={15} className="text-brand-purple mt-0.5 shrink-0" />
                  <p className="text-xs text-stone-600 leading-snug">
                    <span className="font-semibold text-brand-ink">{data.name}</span> · {data.address.line1}, {data.address.city} {data.address.pincode}
                  </p>
                </div>
                {data.payment && (
                  <div className="flex items-center gap-2 rounded-xl border border-stone-200 p-2.5">
                    <CreditCard size={15} className="text-brand-purple shrink-0" />
                    <p className="text-xs text-stone-600">{data.payment.type} ending {data.payment.last4} · exp {data.payment.expiry}</p>
                  </div>
                )}
              </div>
            )}

            {/* promo: show the APPLIED state once a code is on, otherwise the input */}
            {data.promo ? (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2.5">
                <Check size={15} className="text-emerald-600 shrink-0" />
                <p className="text-sm font-medium text-emerald-700 flex-1">
                  {data.promo} applied{data.discount > 0 ? ` · saved ${rupee(data.discount)}` : ""}
                </p>
              </div>
            ) : (
              <div className="mt-3">
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-2 rounded-xl border border-stone-200 px-3">
                    <Tag size={14} className="text-stone-400" />
                    <input value={promo} onChange={(e) => setPromo(e.target.value.toUpperCase())}
                      placeholder="Promo code (optional)"
                      className="flex-1 bg-transparent py-2.5 text-sm uppercase tracking-wide outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-stone-400" />
                  </div>
                  <button onClick={() => promo && sendUserText(`Apply promo code ${promo}`)}
                    className="px-4 rounded-xl border border-stone-200 text-sm font-semibold text-brand-ink hover:border-brand-purple/40">
                    Apply
                  </button>
                </div>
                {data.promo_error && (
                  <p className="mt-1 text-xs text-red-500">{data.promo_error} isn't valid. Try FESTIVE10 or DIRECT15.</p>
                )}
              </div>
            )}

            <button onClick={() => sendAction("request_payment")} className="btn-primary w-full mt-3">
              <Lock size={15} /> Place order · {rupee(data.total)}
            </button>
          </div>
        )}

        {step === "promo" && (
          <div className="animate-fade-up">
            {data.valid ? (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-center">
                <Check className="mx-auto text-emerald-600" size={22} />
                <p className="mt-1 font-semibold text-emerald-700">{data.code} applied</p>
                <p className="text-sm text-emerald-600">You saved {rupee(data.discount)}</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-stone-600 mb-2">Have a Cymbal Direct offer code?</p>
                <div className="flex gap-2">
                  <input value={promo} onChange={(e) => setPromo(e.target.value.toUpperCase())}
                    placeholder="FESTIVE10"
                    className="flex-1 rounded-xl border border-stone-200 px-3 py-2.5 text-sm uppercase tracking-wide outline-none focus:border-brand-purple/50" />
                  <button onClick={() => promo && sendUserText(`Apply promo code ${promo}`)} className="btn-primary">Apply</button>
                </div>
                {data.code && <p className="mt-2 text-xs text-red-500">{data.code} isn't valid. Try FESTIVE10 or DIRECT15.</p>}
              </>
            )}
            {data.valid && <Totals data={data} />}
            <button onClick={() => sendUserText("Confirm my delivery address")} className="btn-primary w-full mt-4">
              <MapPin size={15} /> Confirm address
            </button>
          </div>
        )}

        {step === "address" && (
          <div className="animate-fade-up">
            <div className="rounded-2xl bg-white border border-stone-200 p-4 shadow-soft">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-brand-purple mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-brand-ink">{data.name}</p>
                  <p className="text-stone-600 leading-snug mt-0.5">
                    {data.address.line1}, {data.address.line2}<br />
                    {data.address.city}, {data.address.state} {data.address.pincode}
                  </p>
                </div>
              </div>
            </div>
            <button onClick={() => sendUserText("Yes that address is correct, proceed to payment")} className="btn-primary w-full mt-4">
              <CreditCard size={15} /> Deliver here & pay
            </button>
          </div>
        )}

        {step === "payment" && (
          <div className="animate-fade-up">
            <div className="rounded-2xl bg-brand-ink text-white p-4 shadow-lift relative overflow-hidden">
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-brand-gradient opacity-40 blur-xl" />
              <div className="relative flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-white/60">{data.type}</span>
                <CreditCard size={20} className="text-white/70" />
              </div>
              <p className="relative mt-5 text-lg tracking-[0.2em] tabular-nums">•••• •••• •••• {data.last4}</p>
              <p className="relative mt-1 text-xs text-white/60">Expires {data.expiry}</p>
            </div>
            {data.promo && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2">
                <Check size={14} className="text-emerald-600 shrink-0" />
                <p className="text-xs font-medium text-emerald-700">{data.promo} applied{data.discount > 0 ? ` · saved ${rupee(data.discount)}` : ""}</p>
              </div>
            )}
            <p className="mt-4 text-sm text-stone-600">Enter your 3-digit CVV to authorize.</p>
            <div className="mt-2 flex gap-2 items-center">
              <input value={cvv} inputMode="numeric" maxLength={3} type="password" autoFocus
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                placeholder="•••"
                className="w-24 text-center tracking-[0.4em] rounded-xl border border-stone-200 px-3 py-2.5 outline-none focus:border-brand-purple/50" />
              <button onClick={() => cvv.length === 3 && sendAction("place_order", { cvv })}
                disabled={cvv.length !== 3} className="btn-primary flex-1">
                <Lock size={15} /> Pay {rupee(data.total ?? undefined)}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-stone-500 flex items-center gap-1">
              <Lock size={11} /> Enter it yourself — never share your CVV with anyone, including the stylist.
            </p>
            <p className="mt-1 text-[11px] text-stone-400">Tokenized & encrypted · CVV is never stored or sent to the assistant.</p>
          </div>
        )}

        {step === "success" && (
          <div className="py-6 text-center animate-fade-up">
            <div className="relative mx-auto h-20 w-20">
              <span className="absolute inset-0 rounded-full bg-emerald-400/30 animate-pulse-ring" />
              <div className="relative grid place-items-center h-20 w-20 rounded-full bg-brand-gradient text-white shadow-glass">
                <PartyPopper size={32} />
              </div>
            </div>
            <h3 className="mt-5 text-xl font-bold text-brand-ink">Order placed!</h3>
            <p className="mt-1 text-sm text-stone-500">
              Order <span className="font-semibold text-brand-ink">{data.order_id}</span> · {rupee(data.total)}
            </p>
            <p className="mt-1 text-sm text-stone-500">Arriving in {data.eta} to {data.address?.city}.</p>
            <button onClick={close} className="btn-primary mt-5">Continue shopping</button>
          </div>
        )}
      </div>
    </Modal>
  );
}

function Totals({ data }: { data: any }) {
  return (
    <div className="mt-3 pt-3 border-t border-stone-200 space-y-1 text-sm">
      <div className="flex justify-between text-stone-600"><span>Subtotal</span><span className="tabular-nums">{rupee(data.subtotal)}</span></div>
      {data.discount > 0 && (
        <div className="flex justify-between text-emerald-600"><span>Discount</span><span className="tabular-nums">– {rupee(data.discount)}</span></div>
      )}
      <div className="flex justify-between font-bold text-brand-ink pt-1"><span>Total</span><span className="tabular-nums">{rupee(data.total)}</span></div>
    </div>
  );
}
