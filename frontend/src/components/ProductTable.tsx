import { useState } from "react";
import { Star, Plus, Check, Sparkles } from "lucide-react";
import type { FundProduct } from "@/types";
import { useStore } from "@/store";
import { sendAction } from "@/ws";
import { Button } from "@/components/ui/button";

export default function ProductTable({ funds }: { funds: FundProduct[] }) {
	const { highlightIds, basket, addToBasket, pushToast } = useStore();
	const [sipMap, setSipMap] = useState<Record<string, number>>({});

	const getSip = (id: string) => sipMap[id] || 25000;

	const handleAdd = (fund: FundProduct) => {
		const sipAmount = getSip(fund.id);
		addToBasket({
			product_id: fund.id,
			name: fund.name,
			category: fund.category,
			sub_category: fund.sub_category,
			lumpsum_inr: 0,
			monthly_sip_inr: sipAmount,
			linked_goal: fund.sub_category.includes("Retirement")
				? "Retirement 2042"
				: "Wealth Creation",
			cagr_3y: fund.cagr_3y,
			ter: fund.ter,
		});
		sendAction("add_to_basket", {
			product_id: fund.id,
			monthly_sip_amount_inr: sipAmount,
			lumpsum_amount_inr: 0,
			linked_goal: "Wealth Creation",
		});
		pushToast(
			`Added ${fund.name} (₹${(sipAmount / 1000).toFixed(0)}k/mo) to Advisory Basket`,
			"success",
		);
	};

	const getRiskBadge = (risk: string) => {
		const r = risk.toLowerCase();
		if (r.includes("low"))
			return "bg-blue-500/15 text-blue-300 border-blue-500/30";
		if (r.includes("moderate"))
			return "bg-teal-500/15 text-teal-300 border-teal-500/30";
		if (r.includes("moderately high"))
			return "bg-amber-500/15 text-amber-300 border-amber-500/30";
		return "bg-rose-500/15 text-rose-300 border-rose-500/30";
	};

	return (
		<div className="glass-panel rounded-2xl overflow-hidden shadow-sm dark:shadow-card-luxury border border-slate-200 dark:border-white/10">
			<div className="overflow-x-auto">
				<table className="w-full text-left text-xs border-collapse">
					<thead>
						<tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/80 text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
							<th className="py-3 px-4">Instrument & AMC</th>
							<th className="py-3 px-3">Subcategory</th>
							<th className="py-3 px-3">Riskometer</th>
							<th className="py-3 px-3 text-right">3Y CAGR</th>
							<th className="py-3 px-3 text-right">TER</th>
							<th className="py-3 px-3 text-right">AUM (₹ Cr)</th>
							<th className="py-3 px-3 text-center">Rating</th>
							<th className="py-3 px-4 text-right">Allocation Action</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-200 dark:divide-white/5">
						{funds.map((fund) => {
							const isHighlighted = highlightIds.includes(fund.id);
							const inBasket = basket.some((b) => b.product_id === fund.id);
							const sipAmount = getSip(fund.id);

							return (
								<tr
									key={fund.id}
									className={`transition-colors duration-150 ${
										isHighlighted
											? "bg-amber-400/20 ring-1 ring-amber-400/50"
											: inBasket
												? "bg-emerald-50 dark:bg-emerald-950/30"
												: "hover:bg-slate-50/80 dark:hover:bg-slate-900/60"
									}`}
								>
									{/* Name & AMC */}
									<td className="py-3 px-4 max-w-[280px]">
										<div className="flex items-center gap-2">
											{isHighlighted && (
												<Sparkles className="size-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
											)}
											<div>
												<p className="font-bold text-slate-900 dark:text-white leading-snug line-clamp-1">
													{fund.name}
												</p>
												<p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
													{fund.amc}
												</p>
											</div>
										</div>
									</td>

									{/* Subcategory */}
									<td className="py-3 px-3 whitespace-nowrap">
										<span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300">
											{fund.sub_category}
										</span>
									</td>

									{/* Riskometer */}
									<td className="py-3 px-3 whitespace-nowrap">
										<span
											className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getRiskBadge(
												fund.risk_level,
											)}`}
										>
											{fund.risk_level}
										</span>
									</td>

									{/* 3Y CAGR */}
									<td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
										+{fund.cagr_3y}%
									</td>

									{/* TER */}
									<td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
										{fund.ter}%
									</td>

									{/* AUM */}
									<td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
										₹{(fund.aum_crores / 1000).toFixed(1)}k
									</td>

									{/* Rating */}
									<td className="py-3 px-3 text-center whitespace-nowrap">
										<div className="inline-flex items-center gap-0.5 text-amber-500 dark:text-amber-400">
											{Array.from({ length: fund.rating }).map((_, i) => (
												<Star key={i} className="size-2.5 fill-current" />
											))}
										</div>
									</td>

									{/* Actions */}
									<td className="py-3 px-4 text-right whitespace-nowrap">
										<div className="inline-flex items-center gap-1.5">
											<span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mr-1">
												₹25k/mo
											</span>
											<Button
												size="sm"
												onClick={() => handleAdd(fund)}
												className={`h-6.5 px-2.5 text-[11px] font-semibold rounded-md transition-all duration-200 ${
													inBasket
														? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
														: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-amber-400 hover:text-slate-950 hover:border-amber-400 hover:shadow-[0_0_14px_rgba(251,191,36,0.6)] hover:scale-105 active:scale-95"
												}`}
											>
												{inBasket ? (
													<Check className="size-3" />
												) : (
													<Plus className="size-3" />
												)}
												<span className="ml-1">
													{inBasket ? "In Basket" : "Add"}
												</span>
											</Button>
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
}
