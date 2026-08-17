import {
	X,
	Trash2,
	FileText,
	CheckCircle2,
	ShieldCheck,
	ArrowRight,
	TrendingUp,
} from "lucide-react";
import { useStore } from "../store";
import { sendAction } from "../ws";

export default function CartDrawer() {
	const {
		basket,
		basketOpen,
		totalLumpsum,
		totalSip,
		set,
		removeFromBasket,
		pushToast,
	} = useStore();

	if (!basketOpen) return null;

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
		<div className="fixed inset-0 z-50 overflow-hidden">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
				onClick={() => set({ basketOpen: false })}
			/>

			<div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
				<div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-slate-200">
					{/* Header */}
					<div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
						<div className="flex items-center gap-2">
							<div className="h-8 w-8 rounded-lg bg-[#0B2545] text-amber-400 flex items-center justify-center font-bold">
								<ShieldCheck size={18} />
							</div>
							<div>
								<h2 className="text-sm font-bold text-slate-900">
									Advisory Basket
								</h2>
								<p className="text-[11px] text-slate-500 font-medium">
									{basket.length} Selected Investment Instruments
								</p>
							</div>
						</div>
						<button
							onClick={() => set({ basketOpen: false })}
							className="h-8 w-8 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition"
						>
							<X size={16} />
						</button>
					</div>

					{/* Items List */}
					<div className="flex-1 p-4 overflow-y-auto space-y-3">
						{basket.length === 0 ? (
							<div className="text-center py-16 text-slate-400">
								<ShieldCheck
									size={40}
									className="mx-auto text-slate-300 mb-2"
								/>
								<p className="font-bold text-slate-700 text-sm">
									Your Advisory Basket is empty
								</p>
								<p className="text-xs text-slate-400 mt-1">
									Add mutual funds, ETFs, or bonds from the Product Explorer or
									ask Ananya.
								</p>
							</div>
						) : (
							basket.map((item) => (
								<div
									key={item.product_id}
									className="bg-slate-50 rounded-xl border border-slate-200 p-3 flex flex-col justify-between"
								>
									<div className="flex items-start justify-between gap-2">
										<div>
											<span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 text-[9px] font-bold">
												{item.sub_category}
											</span>
											<h4 className="text-xs font-bold text-slate-900 mt-1 leading-snug">
												{item.name}
											</h4>
											<p className="text-[10px] text-slate-500 font-medium mt-0.5">
												Goal:{" "}
												<span className="font-bold text-slate-700">
													{item.linked_goal || "Wealth Creation"}
												</span>
											</p>
										</div>
										<button
											onClick={() => {
												removeFromBasket(item.product_id);
												sendAction("remove_from_basket", {
													product_id: item.product_id,
												});
											}}
											className="text-slate-400 hover:text-rose-600 p-1 rounded transition"
											title="Remove instrument"
										>
											<Trash2 size={14} />
										</button>
									</div>

									<div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/60 text-xs">
										<div>
											<span className="text-[10px] text-slate-400 font-semibold block">
												Monthly SIP
											</span>
											<span className="font-extrabold text-emerald-700">
												{item.monthly_sip_inr
													? `₹${item.monthly_sip_inr.toLocaleString()} / mo`
													: "-"}
											</span>
										</div>
										<div>
											<span className="text-[10px] text-slate-400 font-semibold block">
												Lump Sum
											</span>
											<span className="font-extrabold text-slate-800">
												{item.lumpsum_inr
													? `₹${item.lumpsum_inr.toLocaleString()}`
													: "-"}
											</span>
										</div>
										<div>
											<span className="text-[10px] text-slate-400 font-semibold block">
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
						<div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
							<div className="space-y-1.5 text-xs">
								<div className="flex justify-between text-slate-600 font-semibold">
									<span>Total One-Time Lump Sum:</span>
									<span className="font-bold text-slate-900">
										₹{totalLumpsum.toLocaleString()}
									</span>
								</div>
								<div className="flex justify-between text-slate-900 font-bold text-sm">
									<span>Total Monthly SIP Commitment:</span>
									<span className="text-emerald-700 font-black">
										₹{totalSip.toLocaleString()} / mo
									</span>
								</div>
							</div>

							<div className="space-y-2 pt-1">
								<button
									onClick={handleGenerateProposal}
									className="w-full py-2.5 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs"
								>
									<FileText size={15} className="text-blue-600" />
									<span>Generate Advisory Proposal (PDF)</span>
								</button>

								<button
									onClick={handleProceedMandate}
									className="w-full py-2.5 px-3 rounded-xl bg-[#0B2545] hover:bg-[#134074] text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md"
								>
									<span>Proceed to Mandate Sign-Off (e-NACH)</span>
									<ArrowRight size={15} />
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
