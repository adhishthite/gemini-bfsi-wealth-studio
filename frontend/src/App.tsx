import { useEffect, useState } from "react";
import { MessageCircle, X, Sparkles } from "lucide-react";
import { connect } from "./ws";
import { useStore } from "./store";
import TopBar from "./components/TopBar";
import FilterBar from "./components/FilterBar";
import CatalogGrid from "./components/CatalogGrid";
import StylistPanel from "./components/StylistPanel";
import CartDrawer from "./components/CartDrawer";
import VtoModal from "./components/VtoModal";
import CheckoutModal from "./components/CheckoutModal";
import OrdersModal from "./components/OrdersModal";
import ProposalModal from "./components/ProposalModal";
import Toasts from "./components/Toasts";

export default function App() {
	const [sheetOpen, setSheetOpen] = useState(false);
	const chatLen = useStore((s) => s.chat.length);

	useEffect(() => {
		connect();
	}, []);

	useEffect(() => {
		if (chatLen > 1) setSheetOpen(true);
	}, [chatLen]);

	return (
		<div className="min-h-dvh flex flex-col bg-slate-100 text-slate-900">
			<TopBar />

			<main className="flex-1 mx-auto w-full max-w-[1650px] px-4 sm:px-6 py-4">
				<div className="flex gap-5 h-[calc(100dvh-6rem)]">
					{/* Left Column: FilterBar & Product Explorer */}
					<div className="flex-1 min-w-0 flex flex-col gap-3 overflow-hidden">
						<FilterBar />
						<div className="flex-1 overflow-y-auto pr-1">
							<CatalogGrid />
						</div>
					</div>

					{/* Right Column: Ananya Advisor Dock */}
					<div className="hidden lg:block w-[420px] shrink-0 h-full">
						<StylistPanel />
					</div>
				</div>
			</main>

			{/* Mobile Floating Trigger */}
			<button
				onClick={() => setSheetOpen((v) => !v)}
				className="lg:hidden fixed bottom-5 right-5 z-[80] grid place-items-center h-14 w-14 rounded-full bg-[#0B2545] text-amber-300 shadow-xl active:scale-90 transition"
				aria-label="Open advisor chat"
			>
				{sheetOpen ? <X size={22} /> : <MessageCircle size={24} />}
			</button>

			{/* Mobile Bottom Sheet */}
			<div
				className={`lg:hidden fixed inset-x-0 bottom-0 z-[75] transition-transform duration-300 ${
					sheetOpen ? "translate-y-0" : "translate-y-[110%]"
				}`}
			>
				<div className="h-[78dvh] mx-2 mb-2">
					<StylistPanel />
				</div>
			</div>

			{/* All Modals & Drawers */}
			<CartDrawer />
			<VtoModal />
			<CheckoutModal />
			<OrdersModal />
			<ProposalModal />
			<Toasts />
		</div>
	);
}
