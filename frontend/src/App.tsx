import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { connect } from "./ws";
import { useStore } from "./store";
import TopBar from "./components/TopBar";
import CatalogGrid from "./components/CatalogGrid";
import StylistPanel from "./components/StylistPanel";
import CartDrawer from "./components/CartDrawer";
import SizingModal from "./components/SizingModal";
import VtoModal from "./components/VtoModal";
import CheckoutModal from "./components/CheckoutModal";
import OrdersModal from "./components/OrdersModal";
import Toasts from "./components/Toasts";

export default function App() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const chatLen = useStore((s) => s.chat.length);

  useEffect(() => { connect(); }, []);
  // pop the mobile sheet open when Aria replies
  useEffect(() => { if (chatLen > 0) setSheetOpen(true); }, [chatLen]);

  return (
    <div className="min-h-dvh flex flex-col">
      <TopBar />

      <main className="flex-1 mx-auto w-full max-w-[1500px] px-4 sm:px-6 py-5">
        <div className="flex gap-5 h-[calc(100dvh-7rem)]">
          {/* Catalog */}
          <div className="flex-1 min-w-0 overflow-y-auto scroll-thin pr-1">
            <CatalogGrid />
          </div>

          {/* Stylist panel (desktop) */}
          <div className="hidden lg:block w-[400px] shrink-0">
            <StylistPanel />
          </div>
        </div>
      </main>

      {/* Mobile: floating button + bottom sheet */}
      <button
        onClick={() => setSheetOpen((v) => !v)}
        className="lg:hidden fixed bottom-5 right-5 z-[80] grid place-items-center h-14 w-14 rounded-full bg-brand-gradient text-white shadow-lift active:scale-90 transition"
        aria-label="Open stylist chat">
        {sheetOpen ? <X size={22} /> : <MessageCircle size={24} />}
      </button>
      <div className={`lg:hidden fixed inset-x-0 bottom-0 z-[75] transition-transform duration-300 ${sheetOpen ? "translate-y-0" : "translate-y-[110%]"}`}>
        <div className="h-[78dvh] mx-2 mb-2">
          <StylistPanel />
        </div>
      </div>

      <CartDrawer />
      <SizingModal />
      <VtoModal />
      <CheckoutModal />
      <OrdersModal />
      <Toasts />
    </div>
  );
}
