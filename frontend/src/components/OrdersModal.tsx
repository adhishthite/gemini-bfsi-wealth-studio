import { Package, MapPin, Truck } from "lucide-react";
import Modal from "./Modal";
import { useStore } from "../store";
import { asset, rupee } from "../lib";

export default function OrdersModal() {
  const { ordersOpen, orders, set } = useStore();
  if (!ordersOpen) return null;
  const close = () => set({ ordersOpen: false });

  return (
    <Modal open onClose={close} maxW="max-w-lg" title="My Orders">
      <div className="px-6 pb-6">
        {(!orders || orders.length === 0) ? (
          <div className="py-12 text-center text-stone-500">
            <Package size={34} className="mx-auto text-stone-300" />
            <p className="mt-3 text-sm">No orders yet. Your placed orders will show up here.</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[64vh] overflow-y-auto scroll-thin">
            {orders.map((o: any) => (
              <div key={o.order_id} className="rounded-2xl border border-stone-200 p-4 shadow-soft">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="grid place-items-center h-8 w-8 rounded-full bg-brand-gradient text-white"><Package size={15} /></span>
                    <div>
                      <p className="text-sm font-bold text-brand-ink">Order {o.order_id}</p>
                      <p className="text-[11px] text-stone-500">{o.placed || "Placed"} · {o.items?.length || 0} item(s)</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold tabular-nums">{rupee(o.total)}</span>
                </div>

                <div className="mt-3 flex gap-2 overflow-x-auto scroll-thin">
                  {o.items?.map((it: any) => (
                    <div key={it.sku_id + it.size} className="shrink-0 w-12 text-center">
                      <img src={asset(it.image)} alt={it.name} className="h-14 w-12 rounded-lg object-cover bg-stone-100" />
                      <p className="mt-1 text-[9px] text-stone-500 leading-tight line-clamp-2">{it.name}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-4 text-[11px] text-stone-500">
                  <span className="flex items-center gap-1"><Truck size={12} className="text-brand-purple" /> Arriving in {o.eta}</span>
                  {o.address?.city && <span className="flex items-center gap-1"><MapPin size={12} className="text-brand-purple" /> {o.address.city}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
        <button onClick={close} className="btn-primary w-full mt-5">Continue shopping</button>
      </div>
    </Modal>
  );
}
