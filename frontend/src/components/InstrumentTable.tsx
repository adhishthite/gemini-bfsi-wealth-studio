import { useState } from "react";
import { Check, Plus } from "lucide-react";
import type { FundProduct } from "@/types";
import { useStore } from "@/store";
import { sendAction } from "@/ws";
import { rupee, pct } from "@/lib";
import { Button } from "@/components/ui/button";

export default function InstrumentTable({ funds }: { funds: FundProduct[] }) {
	const { highlightIds, basket, addToBasket } = useStore();
	const [sipMap] = useState<Record<string, number>>({});

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
	};

	return (
		<div className="paper overflow-hidden">
			<div className="overflow-x-auto">
				<table className="w-full border-collapse text-left text-xs">
					<thead>
						<tr className="border-b border-rule-strong bg-paper-sunken">
							<th className="label px-5 py-3">Instrument</th>
							<th className="label px-4 py-3">Category</th>
							<th className="label px-4 py-3">Risk band</th>
							<th className="label px-4 py-3 text-right">3-year CAGR</th>
							<th className="label px-4 py-3 text-right">Expense ratio</th>
							<th className="label px-4 py-3 text-right">Fund size</th>
							<th className="label px-4 py-3 text-right">Rating</th>
							<th className="label px-5 py-3 text-right">Allocation</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-rule">
						{funds.map((fund) => {
							const isHighlighted = highlightIds.includes(fund.id);
							const inBasket = basket.some((b) => b.product_id === fund.id);
							const sipAmount = getSip(fund.id);

							return (
								<tr
									key={fund.id}
									className={`transition-colors ${
										isHighlighted
											? "bg-stamp-wash"
											: "hover:bg-paper-sunken"
									}`}
								>
									{/* Instrument & AMC */}
									<td
										className={`max-w-[320px] py-5 pl-5 pr-4 ${
											isHighlighted
												? "border-l-[3px] border-stamp"
												: "border-l-[3px] border-transparent"
										}`}
									>
										<p className="text-sm font-semibold leading-snug text-ink-strong">
											{fund.name}
										</p>
										<p className="mt-1 text-xs text-ink-muted">{fund.amc}</p>
										{isHighlighted && (
											<span className="label mt-1.5 block text-stamp">
												Recommended
											</span>
										)}
									</td>

									{/* Category */}
									<td className="whitespace-nowrap px-4 py-5 text-xs text-ink">
										{fund.sub_category}
									</td>

									{/* Risk band — weight, not hue */}
									<td className="whitespace-nowrap px-4 py-5 text-xs font-medium text-ink">
										{fund.risk_level}
									</td>

									{/* The hero column */}
									<td className="whitespace-nowrap px-4 py-5 text-right">
										<span className="figure-sm text-ink-strong">
											{pct(fund.cagr_3y)}
										</span>
									</td>

									{/* Expense ratio */}
									<td className="whitespace-nowrap px-4 py-5 text-right text-xs tabular-nums text-ink">
										{pct(fund.ter, 2)}
									</td>

									{/* Fund size */}
									<td className="whitespace-nowrap px-4 py-5 text-right text-xs tabular-nums text-ink">
										{rupee(fund.aum_crores)} Cr
									</td>

									{/* Rating */}
									<td className="whitespace-nowrap px-4 py-5 text-right text-xs tabular-nums text-ink-muted">
										{fund.rating} / 5
									</td>

									{/* Allocation action */}
									<td className="whitespace-nowrap py-5 pl-4 pr-5 text-right">
										<div className="flex items-center justify-end gap-3">
											<span className="text-xs tabular-nums text-ink-muted">
												{rupee(sipAmount)} monthly
											</span>
											<Button
												size="sm"
												variant="outline"
												onClick={() => handleAdd(fund)}
												className={`h-8 rounded-lg border px-3 text-xs font-semibold transition-colors ${
													inBasket
														? "border-rule-strong bg-paper-sunken text-ink-muted hover:bg-paper-sunken"
														: "border-rule bg-paper-sheet text-ink hover:border-rule-strong hover:bg-paper-sunken"
												}`}
											>
												{inBasket ? (
													<Check className="size-3.5" />
												) : (
													<Plus className="size-3.5" />
												)}
												<span className="ml-1.5">
													{inBasket ? "Staged" : "Stage"}
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
