import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { connect } from "@/ws";
import { useStore } from "@/store";
import TopBar from "@/components/TopBar";
import FilterBar from "@/components/FilterBar";
import CatalogGrid from "@/components/CatalogGrid";
import AdvisorDock from "@/components/AdvisorDock";
import AdvisoryBasketSheet from "@/components/AdvisoryBasketSheet";
import DiagnosticsDialog from "@/components/DiagnosticsDialog";
import SimulationDialog from "@/components/SimulationDialog";
import MandateDialog from "@/components/MandateDialog";
import ProposalDialog from "@/components/ProposalDialog";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";

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
		<div className="min-h-dvh flex flex-col bg-background text-foreground">
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
						<AdvisorDock />
					</div>
				</div>
			</main>

			{/* Mobile Floating Trigger */}
			<Button
				onClick={() => setSheetOpen((v) => !v)}
				size="icon"
				variant="wealth"
				className="lg:hidden fixed bottom-5 right-5 z-[80] size-14 rounded-full shadow-xl active:scale-95"
				aria-label="Open advisor chat"
			>
				{sheetOpen ? (
					<X className="size-6 text-amber-300" />
				) : (
					<MessageCircle className="size-6 text-amber-300" />
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
			<DiagnosticsDialog />
			<SimulationDialog />
			<MandateDialog />
			<ProposalDialog />
			<Toaster richColors position="bottom-right" />
		</div>
	);
}
