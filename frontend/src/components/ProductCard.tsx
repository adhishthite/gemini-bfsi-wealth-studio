import { useState } from "react";
import { Star, Plus, Check, Sparkles } from "lucide-react";
import type { FundProduct } from "@/types";
import { useStore } from "@/store";
import { sendAction } from "@/ws";
import { Button } from "@/components/ui/button";

export default function ProductCard({ fund }: { fund: FundProduct }) {
	const { highlightIds, basket, addToBasket, pushToast } = useStore();
	const [sipAmount] = useState<number>(25000);

	const isHighlighted = highlightIds.includes(fund.id);
	const inBasket = basket.some((b) => b.product_id === fund.id);

	const handleAddSip = (e: React.MouseEvent) => {
		e.stopPropagation();
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

	return (
		<div
			className={`group relative rounded-xl p-4 flex flex-col justify-between transition-all duration-200 border ${
				isHighlighted
					? "bg-amber-400/[0.04] dark:bg-amber-400/[0.03] border-amber-400/60 shadow-md ring-1 ring-amber-400/30"
					: inBasket
						? "bg-emerald-500/[0.03] border-emerald-500/40 shadow-xs"
						: "bg-white/80 dark:bg-slate-900/40 border-slate-200/80 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/15 hover:bg-white dark:hover:bg-slate-900/70 shadow-xs"
			}`}
		>
			{/* Recommended Ribbon */}
			{isHighlighted && (
				<div className="absolute top-0 right-3 -translate-y-1/2 bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
					<Sparkles className="size-2.5" />
					<span>Top RM Pick</span>
				</div>
			)}

			<div className="space-y-2.5">
				{/* Category & Rating */}
				<div className="flex items-center justify-between text-[11px]">
					<span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
						{fund.sub_category}
					</span>
					<div className="flex items-center gap-1 text-amber-500/90 dark:text-amber-400/90">
						<Star className="size-3 fill-current" />
						<span className="font-mono text-[11px] font-bold text-slate-600 dark:text-slate-300">
							{fund.rating}.0
						</span>
					</div>
				</div>

				{/* Title & AMC */}
				<div>
					<h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors line-clamp-1">
						{fund.name}
					</h4>
					<p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
						{fund.amc}
					</p>
				</div>

				{/* Financial Metrics: 3 clean columns without heavy card wrappers */}
				<div className="flex items-baseline justify-between pt-1 border-t border-slate-100 dark:border-white/[0.04]">
					<div>
						<span className="text-[10px] text-slate-400 dark:text-slate-500 block">
							3Y CAGR
						</span>
						<span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
							+{fund.cagr_3y}%
						</span>
					</div>
					<div>
						<span className="text-[10px] text-slate-400 dark:text-slate-500 block">
							TER
						</span>
						<span className="text-xs font-semibold font-mono text-slate-700 dark:text-slate-300">
							{fund.ter}%
						</span>
					</div>
					<div>
						<span className="text-[10px] text-slate-400 dark:text-slate-500 block">
							AUM
						</span>
						<span className="text-xs font-semibold font-mono text-slate-700 dark:text-slate-300">
							₹{(fund.aum_crores / 1000).toFixed(1)}k Cr
						</span>
					</div>
				</div>

				{/* Top holdings as quiet inline text */}
				<p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
					<span className="text-slate-400 dark:text-slate-500">Holdings:</span>{" "}
					{fund.top_holdings.slice(0, 3).join(", ")}
				</p>
			</div>

			{/* Subtle, Understated Footer Action */}
			<div className="pt-3 mt-3 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between">
				<span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
					₹25k / mo SIP
				</span>

				<Button
					size="sm"
					onClick={handleAddSip}
					className={`h-7 px-3 text-[11px] font-bold rounded-lg transition-all duration-200 ${
						inBasket
							? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 shadow-xs"
							: "bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 hover:bg-amber-400 hover:text-slate-950 hover:border-amber-400 hover:shadow-[0_0_16px_rgba(251,191,36,0.65)] hover:ring-1 hover:ring-amber-400/60 hover:scale-105 active:scale-95"
					}`}
				>
					{inBasket ? (
						<>
							<Check className="size-3 mr-1" />
							<span>In Basket</span>
						</>
					) : (
						<>
							<Plus className="size-3 mr-1" />
							<span>Add</span>
						</>
					)}
				</Button>
			</div>
		</div>
	);
}

