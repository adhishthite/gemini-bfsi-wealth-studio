import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { connect } from "@/ws";
import { useStore } from "@/store";
import TopBar from "@/components/TopBar";
import FilterBar from "@/components/FilterBar";
import CatalogGrid from "@/components/CatalogGrid";
import DiagnosticsView from "@/components/DiagnosticsView";
import SimulationView from "@/components/SimulationView";
import AdvisorDock from "@/components/AdvisorDock";
import AdvisoryBasketSheet from "@/components/AdvisoryBasketSheet";
import MandateDialog from "@/components/MandateDialog";
import ProposalDialog from "@/components/ProposalDialog";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";

export default function App() {
	const [sheetOpen, setSheetOpen] = useState(false);
	const { activeTab, expandedAdvisor } = useStore();
	const chatLen = useStore((s) => s.chat.length);

	useEffect(() => {
		connect();
		const currentTheme = useStore.getState().theme;
		document.documentElement.classList.toggle("dark", currentTheme === "dark");
	}, []);

	useEffect(() => {
		if (chatLen > 1) setSheetOpen(true);
	}, [chatLen]);

	return (
		<div className="min-h-dvh flex flex-col bg-background text-foreground transition-colors duration-200 selection:bg-amber-400 selection:text-slate-950">
			<TopBar />

			<main className="flex-1 mx-auto w-full max-w-[1750px] px-4 sm:px-6 py-4">
				<div className="flex gap-5 h-[calc(100dvh-6rem)]">
					{/* Left Column: Studio Interactive Canvas */}
					<div className="flex-1 min-w-0 flex flex-col gap-3 overflow-hidden">
						{activeTab === "explorer" && (
							<>
								<FilterBar />
								<div className="flex-1 overflow-y-auto pr-1">
									<CatalogGrid />
								</div>
							</>
						)}

						{activeTab === "diagnostics" && (
							<div className="flex-1 overflow-y-auto pr-1">
								<DiagnosticsView />
							</div>
						)}

						{activeTab === "simulation" && (
							<div className="flex-1 overflow-y-auto pr-1">
								<SimulationView />
							</div>
						)}
					</div>

					{/* Right Column: Ananya Advisor Dock */}
					<div
						className={`hidden lg:block shrink-0 h-full transition-all duration-300 ${
							expandedAdvisor ? "w-[560px]" : "w-[430px]"
						}`}
					>
						<AdvisorDock />
					</div>
				</div>
			</main>

			{/* Mobile Floating Trigger */}
			<Button
				onClick={() => setSheetOpen((v) => !v)}
				size="icon"
				className="lg:hidden fixed bottom-5 right-5 z-[80] size-14 rounded-full shadow-2xl bg-amber-400 text-slate-950 hover:bg-amber-300 active:scale-95 border-2 border-amber-300/60"
				aria-label="Open advisor chat"
			>
				{sheetOpen ? (
					<X className="size-6" />
				) : (
					<MessageCircle className="size-6" />
				)}
			</Button>

			{/* Mobile Bottom Sheet for Advisor Dock */}
			<div
				className={`lg:hidden fixed inset-x-0 bottom-0 z-[75] transition-transform duration-300 ${
					sheetOpen ? "translate-y-0" : "translate-y-[110%]"
				}`}
			>
				<div className="h-[78dvh] mx-2 mb-2">
					<AdvisorDock />
				</div>
			</div>

			{/* ShadCN Dialogs, Sheets & Toast System */}
			<AdvisoryBasketSheet />
			<MandateDialog />
			<ProposalDialog />
			<Toaster richColors position="bottom-right" />
		</div>
	);
}

