import {
	Trash2,
	FileText,
	ShieldCheck,
	ArrowRight,
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
import { Badge } from "@/components/ui/badge";
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
			<SheetContent side="right" className="sm:max-w-md">
				{/* Header */}
				<SheetHeader>
					<div className="flex items-center gap-2.5">
						<div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
							<ShieldCheck className="size-4 text-amber-300" />
						</div>
						<div>
							<SheetTitle>Advisory Basket</SheetTitle>
							<SheetDescription>
								{basket.length} Selected Investment Instruments
							</SheetDescription>
						</div>
					</div>
				</SheetHeader>

				{/* Items List */}
				<div className="flex-1 p-4 overflow-y-auto space-y-3">
					{basket.length === 0 ? (
						<div className="text-center py-16 text-muted-foreground">
							<ShieldCheck className="size-10 mx-auto text-muted-foreground/40 mb-2" />
							<p className="font-bold text-foreground text-sm">
								Your Advisory Basket is empty
							</p>
							<p className="text-xs text-muted-foreground mt-1">
								Add mutual funds, ETFs, or bonds from the Product Explorer or ask Ananya.
							</p>
						</div>
					) : (
						basket.map((item) => (
							<div
								key={item.product_id}
								className="bg-muted/40 rounded-xl border border-border p-3 flex flex-col justify-between"
							>
								<div className="flex items-start justify-between gap-2">
									<div>
										<Badge variant="tag" className="text-[9px]">
											{item.sub_category}
										</Badge>
										<h4 className="text-xs font-bold text-foreground mt-1 leading-snug">
											{item.name}
										</h4>
										<p className="text-[10px] text-muted-foreground font-medium mt-0.5">
											Goal:{" "}
											<span className="font-bold text-foreground">
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
										className="text-muted-foreground hover:text-destructive size-7"
										title="Remove instrument"
									>
										<Trash2 className="size-3.5" />
									</Button>
								</div>

								<div className="flex items-center justify-between mt-3 pt-2 border-t border-border text-xs">
									<div>
										<span className="text-[10px] text-muted-foreground font-semibold block">
											Monthly SIP
										</span>
										<span className="font-extrabold text-emerald-700">
											{item.monthly_sip_inr
												? `₹${item.monthly_sip_inr.toLocaleString()} / mo`
												: "-"}
										</span>
									</div>
									<div>
										<span className="text-[10px] text-muted-foreground font-semibold block">
											Lump Sum
										</span>
										<span className="font-extrabold text-foreground">
											{item.lumpsum_inr
												? `₹${item.lumpsum_inr.toLocaleString()}`
												: "-"}
										</span>
									</div>
									<div>
										<span className="text-[10px] text-muted-foreground font-semibold block">
											3Y CAGR
										</span>
										<span className="font-bold text-blue-600">
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
					<SheetFooter className="p-4 border-t border-border bg-muted/20 space-y-3">
						<div className="space-y-1.5 text-xs w-full">
							<div className="flex justify-between text-muted-foreground font-semibold">
								<span>Total One-Time Lump Sum:</span>
								<span className="font-bold text-foreground">
									₹{totalLumpsum.toLocaleString()}
								</span>
							</div>
							<div className="flex justify-between text-foreground font-bold text-sm">
								<span>Total Monthly SIP Commitment:</span>
								<span className="text-emerald-700 font-black">
									₹{totalSip.toLocaleString()} / mo
								</span>
							</div>
						</div>

						<Separator />

						<div className="space-y-2 w-full pt-1">
							<Button
								variant="outline"
								onClick={handleGenerateProposal}
								className="w-full h-10 gap-2 font-bold text-xs"
							>
								<FileText className="size-4 text-blue-600" />
								<span>Generate Advisory Proposal (PDF)</span>
							</Button>

							<Button
								variant="wealth"
								onClick={handleProceedMandate}
								className="w-full h-10 gap-2 font-bold text-xs"
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
