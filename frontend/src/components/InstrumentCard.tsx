import { useState } from "react";
import { Check, Plus } from "lucide-react";
import type { FundProduct } from "@/types";
import { useStore } from "@/store";
import { sendAction } from "@/ws";
import { rupee, pct } from "@/lib";
import { Button } from "@/components/ui/button";

/** Quiet label / value pair. The supporting facts, deliberately not loud. */
function Fact({ term, value }: { term: string; value: string }) {
	return (
		<div className="flex items-baseline justify-between gap-3">
			<dt className="label">{term}</dt>
			<dd className="text-xs font-medium tabular-nums text-ink">{value}</dd>
		</div>
	);
}

export default function InstrumentCard({ fund }: { fund: FundProduct }) {
	const { highlightIds, basket, addToBasket } = useStore();
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
	};

	return (
		<article
			className={`paper paper-interactive flex h-full flex-col justify-between p-5 ${
				isHighlighted ? "paper-marked" : ""
			}`}
		>
			<div className="space-y-4">
				{/* Fund category, and the one accent on this surface */}
				<div className="flex items-baseline justify-between gap-3">
					<span className="label">{fund.sub_category}</span>
					{isHighlighted && (
						<span className="label text-stamp">Recommended</span>
					)}
				</div>

				<div>
					<h4 className="text-base font-semibold leading-snug text-ink-strong">
						{fund.name}
					</h4>
					<p className="mt-1 text-xs text-ink-muted">{fund.amc}</p>
				</div>

				{/* The hero figure: the return that justifies the recommendation */}
				<div className="border-t border-rule pt-3">
					<span className="label">3-year CAGR</span>
					<div className="mt-1 flex items-baseline gap-1.5">
						<span className="figure text-ink-strong">{pct(fund.cagr_3y)}</span>
						<span className="figure-unit">p.a.</span>
					</div>
				</div>

				<dl className="space-y-2 border-t border-rule pt-3">
					<Fact term="Expense ratio" value={pct(fund.ter, 2)} />
					<Fact term="Fund size" value={`${rupee(fund.aum_crores)} Cr`} />
					<Fact term="Risk band" value={fund.risk_level} />
					<Fact term="Rating" value={`${fund.rating} of 5`} />
				</dl>

				<p className="text-xs leading-relaxed text-ink-muted">
					<span className="text-ink-faint">Top holdings </span>
					{fund.top_holdings.slice(0, 3).join(", ")}
				</p>
			</div>

			<div className="mt-4 flex items-center justify-between gap-3 border-t border-rule pt-3">
				<span className="text-xs tabular-nums text-ink-muted">
					{rupee(sipAmount)} monthly
				</span>

				<Button
					size="sm"
					variant="outline"
					onClick={handleAddSip}
					className={`h-8 rounded-lg border px-3 text-xs font-semibold transition-colors ${
						inBasket
							? "border-rule-strong bg-paper-sunken text-ink-muted hover:bg-paper-sunken"
							: "border-rule bg-paper-sheet text-ink hover:border-rule-strong hover:bg-paper-sunken"
					}`}
				>
					{inBasket ? (
						<>
							<Check className="mr-1.5 size-3.5" />
							<span>Staged</span>
						</>
					) : (
						<>
							<Plus className="mr-1.5 size-3.5" />
							<span>Stage</span>
						</>
					)}
				</Button>
			</div>
		</article>
	);
}
