import { useState } from "react";
import { ShoppingBag, MapPin, CreditCard, ChevronDown, BadgeCheck, Package, ChevronRight } from "lucide-react";
import { useStore } from "../store";
import { sendSetGender } from "../ws";
import { asset } from "../lib";
import Logo from "./Logo";

export default function TopBar() {
  const { cart, filter, setFilter, set, profile, orders } = useStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const lastOrder = orders && orders.length ? orders[0] : null;
  const count = cart.items.reduce((n, i) => n + i.qty, 0);
  const setGender = (g: "all" | "women" | "men") => {
    setFilter({ gender: g, category: "all" }); // explicit "shopping for" — UI filter
    sendSetGender(g);                            // tell the AI which section to show
  };
  const rs = profile?.recommended_sizes || {};

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/60">
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 h-16 flex items-center gap-4">
        <Logo />

        <nav className="hidden md:flex items-center gap-1 ml-6">
          {(["men", "women", "all"] as const).map((g) => (
            <button key={g} onClick={() => setGender(g)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition
                ${filter.gender === g ? "bg-brand-ink text-white" : "text-stone-500 hover:text-brand-ink hover:bg-brand-ink/5"}`}>
              {g === "all" ? "All" : g === "men" ? "Men" : "Women"}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => set({ cartOpen: true })}
            className="relative grid place-items-center h-10 w-10 rounded-full bg-white/70 border border-brand-ink/10 text-brand-ink/80 hover:text-brand-ink transition" aria-label="Open cart">
            <ShoppingBag size={18} />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 grid place-items-center h-5 min-w-5 px-1 rounded-full bg-brand-gradient text-white text-[10px] font-bold animate-scale-in">
                {count}
              </span>
            )}
          </button>

          {/* logged-in user profile */}
          {profile && (
            <div className="relative">
              <button onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2 h-10 pl-1 pr-2 rounded-full bg-white/70 border border-brand-ink/10 hover:border-brand-purple/40 transition"
                aria-label="Your profile">
                <img src={asset(profile.base_photo)} alt={profile.name}
                  className="h-8 w-8 rounded-full object-cover object-top bg-stone-100" />
                <span className="hidden sm:block text-sm font-semibold text-brand-ink max-w-[120px] truncate">
                  {profile.name?.split(" ")[0]}
                </span>
                <ChevronDown size={14} className={`text-stone-400 transition ${profileOpen ? "rotate-180" : ""}`} />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-72 z-50 rounded-2xl bg-white border border-stone-200 shadow-lift p-4 animate-fade-up">
                    <div className="flex items-center gap-3">
                      <img src={asset(profile.base_photo)} alt={profile.name}
                        className="h-12 w-12 rounded-full object-cover object-top bg-stone-100" />
                      <div className="min-w-0">
                        <p className="font-bold text-brand-ink leading-tight flex items-center gap-1">
                          {profile.name} <BadgeCheck size={14} className="text-brand-purple" />
                        </p>
                        <p className="text-xs text-stone-500">Cymbal Direct member · {profile.city}</p>
                      </div>
                    </div>

                    {profile.address && (
                      <div className="mt-3 flex items-start gap-2 text-xs text-stone-600">
                        <MapPin size={14} className="text-brand-purple mt-0.5 shrink-0" />
                        <p className="leading-snug">
                          {profile.address.line1}, {profile.address.line2}<br />
                          {profile.address.city}, {profile.address.state} {profile.address.pincode}
                        </p>
                      </div>
                    )}
                    {profile.payment && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-stone-600">
                        <CreditCard size={14} className="text-brand-purple shrink-0" />
                        <p>{profile.payment.type} ending {profile.payment.last4}</p>
                      </div>
                    )}

                    {(rs.dresses || rs.bottoms || rs.footwear) && (
                      <div className="mt-3 pt-3 border-t border-stone-100">
                        <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide mb-1.5">Your sizes</p>
                        <div className="flex flex-wrap gap-1.5">
                          {rs.dresses && <span className="chip bg-stone-100 text-stone-600">Tops {rs.dresses}</span>}
                          {rs.bottoms && <span className="chip bg-stone-100 text-stone-600">Bottoms {rs.bottoms}</span>}
                          {rs.footwear && <span className="chip bg-stone-100 text-stone-600">Shoes {rs.footwear}</span>}
                        </div>
                      </div>
                    )}

                    {/* My Orders */}
                    <button
                      onClick={() => { setProfileOpen(false); set({ ordersOpen: true }); }}
                      className="mt-3 w-full flex items-center gap-2 rounded-xl border border-stone-200 p-2.5 hover:border-brand-purple/40 transition text-left">
                      <Package size={15} className="text-brand-purple shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-brand-ink">My Orders</p>
                        <p className="text-[11px] text-stone-500 truncate">
                          {lastOrder ? `Last: ${lastOrder.order_id} · ${lastOrder.items?.length || 0} item(s)` : "No orders yet"}
                        </p>
                      </div>
                      <ChevronRight size={15} className="text-stone-400 shrink-0" />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
