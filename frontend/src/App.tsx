import { useEffect, useState } from "react";
import { ChatCircleDots, X } from "@phosphor-icons/react";
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

/* The page measure. Narrower than the operator layout it replaces: a private
   mandate is read, not monitored, so the shell holds a fixed measure and
   spends the rest of the viewport on margin. Shared by the main area and the
   footer so the page has one left edge and one right edge, top to bottom. */
const MEASURE = "mx-auto w-full max-w-[1440px] px-gutter lg:px-12 xl:px-16";

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
		<div className="h-dvh overflow-hidden flex flex-col bg-paper text-ink transition-colors duration-200">
			{/* 1 - Identity. Whose desk this is, and whose money is on it. */}
			<div className="reveal reveal-1 shrink-0">
				<TopBar />
			</div>

			<main className={`flex-1 min-h-0 py-rhythm lg:py-8 ${MEASURE}`}>
				<div className="flex h-full min-h-0 gap-8 xl:gap-10">
					{/* The document under review */}
					<div className="flex flex-1 min-w-0 min-h-0 flex-col gap-rhythm">
						{/* 2 - The parameters the review is drawn against. The
						    wrapper is always mounted so the reveal plays once on
						    load and never on a tab switch; it collapses out of the
						    rhythm entirely on tabs that carry no rail. */}
						<div className="reveal reveal-2 shrink-0 empty:hidden">
							{activeTab === "explorer" && <FilterBar />}
						</div>

						{/* 3 - The finding, and what is being recommended against it.
						    Same rule: the revealed wrapper is stable, the scrolling
						    panes inside it swap per tab and are not animated. */}
						<div className="reveal reveal-3 flex flex-1 min-h-0 flex-col">
							{activeTab === "explorer" && (
								<div className="flex-1 min-h-0 overflow-y-auto pr-1">
									<CatalogGrid />
								</div>
							)}

							{activeTab === "diagnostics" && (
								<div className="flex-1 min-h-0 overflow-y-auto pr-1">
									<DiagnosticsView />
								</div>
							)}

							{activeTab === "simulation" && (
								<div className="flex-1 min-h-0 overflow-y-auto pr-1">
									<SimulationView />
								</div>
							)}
						</div>
					</div>

					{/* 4 - The advisor. The width change is a layout response to the
					    dock expanding, not decoration, so it stays - just slower to
					    read as considered rather than springy. */}
					<div
						className={`reveal reveal-4 hidden lg:block shrink-0 h-full transition-[width] duration-200 ease-out ${
							expandedAdvisor ? "w-[560px]" : "w-[430px]"
						}`}
					>
						<AdvisorDock />
					</div>
				</div>
			</main>

			{/* 5 - The regulated frame. One page-level device, and this is it. */}
			<footer className="reveal reveal-5 shrink-0 border-t border-rule">
				<div
					className={`flex flex-wrap items-center justify-between gap-x-8 gap-y-1 py-4 ${MEASURE}`}
				>
					<p className="label">
						Cymbal Premier &middot; SEBI-registered investment adviser
					</p>
					<p className="label">
						Advisory record &middot; not an offer to buy or sell
					</p>
				</div>
			</footer>

			{/* Mobile advisor trigger. Deliberately neutral ink: the one accent on
			    screen belongs to the dock's primary action, and this affordance
			    never appears on the display an executive is shown. */}
			<Button
				onClick={() => setSheetOpen((v) => !v)}
				size="icon"
				className="lg:hidden fixed bottom-6 right-6 z-80 size-12 rounded-lg border border-rule-strong bg-ink-strong text-paper shadow-sheet hover:bg-ink active:scale-95"
				aria-label="Open advisor chat"
			>
				{sheetOpen ? (
					<X className="size-5" />
				) : (
					<ChatCircleDots className="size-5" />
				)}
			</Button>

			{/* Mobile bottom sheet for the advisor dock */}
			<div
				className={`lg:hidden fixed inset-x-0 bottom-0 z-75 transition-transform duration-300 ${
					sheetOpen ? "translate-y-0" : "translate-y-[110%]"
				}`}
			>
				<div className="h-[78dvh] mx-2 mb-2">
					<AdvisorDock />
				</div>
			</div>

			{/* Dialogs, sheets and toasts */}
			<AdvisoryBasketSheet />
			<MandateDialog />
			<ProposalDialog />
			<Toaster position="bottom-right" />
		</div>
	);
}
