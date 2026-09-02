import { Trash } from "@phosphor-icons/react";
import { useStore } from "@/store";
import { sendAction } from "@/ws";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { inr } from "@/lib";

/* ---------------------------------------------------------------------------
   The staged basket is a schedule of proposed investments, so it is set as
   one: a Caslon heading, 12px column heads, ruled rows, monospaced scheme
   references, right-aligned tabular figures, and a hero total at the foot.
   The single accent here is the mandate action — the one thing the banker
   is being asked to do next.
   ------------------------------------------------------------------------ */

export default function AdvisoryBasketSheet() {
	const { basket, basketOpen, totalLumpsum, totalSip, set, removeFromBasket } =
		useStore();

	const handleGenerateProposal = () => {
		sendAction("generate_advisory_proposal", {
			strategic_rationale:
				"Rebalancing to resolve large cap concentration and deploying the unallocated monthly surplus into goal-linked SIPs.",
		});
	};

	const handleProceedMandate = () => {
		set({ basketOpen: false, mandateModalOpen: true });
		sendAction("request_mandate_authorization");
	};

	return (
		<Sheet open={basketOpen} onOpenChange={(open) => set({ basketOpen: open })}>
			<SheetContent
				side="right"
				className="flex flex-col border-l border-rule bg-paper-sheet p-0 text-ink shadow-raise sm:max-w-md"
			>
				<SheetHeader className="doc-rule space-y-0 border-b-0 bg-transparent px-gutter pb-5 pt-6 text-left">
					<p className="label">Staged for authorisation</p>
					<SheetTitle className="doc-title mt-2 text-xl font-normal">
						Advisory basket
					</SheetTitle>
					<SheetDescription className="mt-2 text-xs text-ink-muted">
						{basket.length === 0
							? "Nothing staged yet"
							: `${basket.length} ${
									basket.length === 1 ? "instrument" : "instruments"
								} proposed against the client's goals`}
					</SheetDescription>
				</SheetHeader>

				{/* The schedule */}
				<div className="flex-1 overflow-y-auto px-gutter pb-6">
					{basket.length === 0 ? (
						<div className="border-t border-rule py-16">
							<p className="text-sm text-ink-strong">No instruments staged</p>
							<p className="mt-2 max-w-xs text-xs leading-relaxed text-ink-muted">
								Add funds from the explorer, or ask Ananya to stage a basket
								against a goal. Staged instruments become the debit schedule on
								the e-NACH mandate.
							</p>
						</div>
					) : (
						<>
							<div className="flex items-baseline justify-between border-b border-rule-strong pb-2">
								<p className="label-strong">Instrument</p>
								<p className="label-strong">Commitment</p>
							</div>
							<ul className="divide-y divide-rule">
								{basket.map((item) => (
									<li key={item.product_id} className="py-4">
										<div className="flex items-start justify-between gap-4">
											<div className="min-w-0">
												<p className="label">{item.sub_category}</p>
												<p className="mt-1.5 text-sm leading-snug text-ink-strong">
													{item.name}
												</p>
												<p className="ref mt-1.5">{item.product_id}</p>
											</div>
											<div className="flex shrink-0 items-start gap-2">
												<div className="text-right">
													<p className="figure-sm tabular-nums">
														{inr(item.monthly_sip_inr || item.lumpsum_inr)}
													</p>
													<p className="label mt-1">
														{item.monthly_sip_inr ? "per month" : "one-time"}
													</p>
												</div>
												<Button
													variant="ghost"
													size="iconSm"
													onClick={() => {
														removeFromBasket(item.product_id);
														sendAction("remove_from_basket", {
															product_id: item.product_id,
														});
													}}
													className="size-7 rounded-lg text-ink-faint hover:text-ink-strong"
													title="Remove from basket"
												>
													<Trash className="size-3.5" />
												</Button>
											</div>
										</div>
										<div className="mt-2.5 flex items-baseline gap-2">
											<span className="label">Goal</span>
											<span className="text-xs text-ink-muted">
												{item.linked_goal || "Wealth creation"}
											</span>
										</div>
									</li>
								))}
							</ul>
						</>
					)}
				</div>

				{basket.length > 0 && (
					<SheetFooter className="flex-col items-stretch space-y-0 border-t border-rule-strong bg-paper-sheet px-gutter py-5">
						<div className="flex items-end justify-between">
							<div>
								<p className="label">Total monthly commitment</p>
								<p className="figure-lg mt-2 tabular-nums">{inr(totalSip)}</p>
							</div>
							<span className="figure-unit pb-2">per month</span>
						</div>

						{totalLumpsum > 0 && (
							<div className="mt-4 flex items-baseline justify-between border-t border-rule pt-4">
								<p className="label">One-time deployment</p>
								<p className="figure-sm tabular-nums">{inr(totalLumpsum)}</p>
							</div>
						)}

						<div className="mt-5 space-y-2.5">
							<Button
								variant="outline"
								onClick={handleGenerateProposal}
								className="h-11 w-full rounded-lg text-sm font-semibold"
							>
								Generate advisory proposal
							</Button>

							<Button
								onClick={handleProceedMandate}
								className="h-11 w-full rounded-lg bg-stamp text-sm font-semibold text-stamp-foreground hover:bg-stamp-strong"
							>
								Authorise e-NACH mandate
							</Button>
						</div>
					</SheetFooter>
				)}
			</SheetContent>
		</Sheet>
	);
}
