import {
	Trash2,
	FileText,
	ShieldCheck,
	ArrowRight,
	Briefcase,
} from "lucide-react";
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
import { Separator } from "@/components/ui/separator";

export default function AdvisoryBasketSheet() {
	const {
		basket,
		basketOpen,
		totalLumpsum,
		totalSip,
		set,
		removeFromBasket,
		pushToast,
	} = useStore();

	const handleGenerateProposal = () => {
		sendAction("generate_advisory_proposal", {
			strategic_rationale:
				"Strategic rebalancing to resolve Large Cap concentration while allocating unallocated monthly cashflow surplus into goal-oriented SIPs.",
		});
		pushToast("Generating Wealth Advisory Proposal PDF...", "info");
	};

	const handleProceedMandate = () => {
		set({ basketOpen: false, mandateModalOpen: true });
		sendAction("request_mandate_authorization");
	};

	return (
		<Sheet open={basketOpen} onOpenChange={(open) => set({ basketOpen: open })}>
			<SheetContent
				side="right"
				className="sm:max-w-md bg-[#0A111E] border-l border-white/10 text-slate-200 p-0 flex flex-col shadow-2xl"
			>
				{/* Header */}
				<SheetHeader className="p-5 bg-slate-950/80 border-b border-white/10">
					<div className="flex items-center gap-3">
						<div className="size-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-xs">
							<Briefcase className="size-5" />
						</div>
						<div>
							<SheetTitle className="text-white text-base">
								Advisory Basket
							</SheetTitle>
							<SheetDescription className="text-slate-400 text-xs">
								{basket.length} Selected Investment Instruments
							</SheetDescription>
						</div>
					</div>
				</SheetHeader>

				{/* Items List */}
				<div className="flex-1 p-4 overflow-y-auto space-y-3">
					{basket.length === 0 ? (
						<div className="text-center py-20 text-slate-400">
							<ShieldCheck className="size-12 mx-auto text-amber-400/40 mb-3" />
							<p className="font-bold text-white text-sm">
								Your Advisory Basket is empty
							</p>
							<p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
								Select mutual funds from the Product Explorer or request Ananya to allocate target baskets.
							</p>
						</div>
					) : (
						basket.map((item) => (
							<div
								key={item.product_id}
								className="bg-slate-950/70 rounded-xl border border-white/10 p-3.5 flex flex-col justify-between shadow-card-luxury space-y-2.5"
							>
								<div className="flex items-start justify-between gap-2">
									<div>
										<span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-900 text-amber-300 border border-white/10">
											{item.sub_category}
										</span>
										<h4 className="text-xs font-bold text-white mt-1.5 leading-snug">
											{item.name}
										</h4>
										<p className="text-[10px] text-slate-400 mt-0.5">
											Goal:{" "}
											<span className="font-bold text-slate-200">
												{item.linked_goal || "Wealth Creation"}
											</span>
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
										className="text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 size-7 rounded-lg"
										title="Remove instrument"
									>
										<Trash2 className="size-3.5" />
									</Button>
								</div>

								<div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
									<div>
										<span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">
											Monthly SIP
										</span>
										<span className="font-mono font-black text-emerald-400">
											{item.monthly_sip_inr
												? `₹${item.monthly_sip_inr.toLocaleString()} / mo`
												: "-"}
										</span>
									</div>
									<div>
										<span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">
											Lump Sum
										</span>
										<span className="font-mono font-bold text-slate-200">
											{item.lumpsum_inr
												? `₹${item.lumpsum_inr.toLocaleString()}`
												: "-"}
										</span>
									</div>
									<div>
										<span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">
											3Y CAGR
										</span>
										<span className="font-mono font-bold text-emerald-400">
											+{item.cagr_3y}%
										</span>
									</div>
								</div>
							</div>
						))
					)}
				</div>

				{/* Footer Summary & Action Buttons */}
				{basket.length > 0 && (
					<SheetFooter className="p-5 border-t border-white/10 bg-slate-950/90 space-y-3">
						<div className="space-y-1.5 text-xs w-full">
							<div className="flex justify-between text-slate-400">
								<span>Total One-Time Lump Sum:</span>
								<span className="font-mono font-bold text-white">
									₹{totalLumpsum.toLocaleString()}
								</span>
							</div>
							<div className="flex justify-between text-white font-bold text-sm">
								<span>Total Monthly SIP:</span>
								<span className="font-mono font-black text-emerald-400 text-base">
									₹{totalSip.toLocaleString()} / mo
								</span>
							</div>
						</div>

						<Separator className="bg-white/10" />

						<div className="space-y-2.5 w-full pt-1">
							<Button
								variant="outline"
								onClick={handleGenerateProposal}
								className="w-full h-10 gap-2 font-bold text-xs bg-slate-900 border-white/10 text-slate-200 hover:text-white rounded-xl"
							>
								<FileText className="size-4 text-amber-400" />
								<span>Generate Advisory Proposal (PDF)</span>
							</Button>

							<Button
								onClick={handleProceedMandate}
								className="w-full h-11 gap-2 font-bold text-xs bg-amber-400 text-slate-950 hover:bg-amber-300 rounded-xl shadow-xs"
							>
								<span>Proceed to Mandate Sign-Off (e-NACH)</span>
								<ArrowRight className="size-4" />
							</Button>
						</div>
					</SheetFooter>
				)}
			</SheetContent>
		</Sheet>
	);
}

