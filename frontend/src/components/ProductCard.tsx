import { useState } from "react";
import { Star, Plus, Check } from "lucide-react";
import type { FundProduct } from "@/types";
import { useStore } from "@/store";
import { sendAction } from "@/ws";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export default function ProductCard({ fund }: { fund: FundProduct }) {
	const { highlightIds, basket, addToBasket, pushToast } = useStore();
	const [sipAmount, setSipAmount] = useState<number>(25000);
	const [lumpAmount] = useState<number>(0);

	const isHighlighted = highlightIds.includes(fund.id);
	const inBasket = basket.some((b) => b.product_id === fund.id);

	const handleAddSip = () => {
		addToBasket({
			product_id: fund.id,
			name: fund.name,
			category: fund.category,
			sub_category: fund.sub_category,
			lumpsum_inr: lumpAmount,
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
			lumpsum_amount_inr: lumpAmount,
			linked_goal: "Wealth Creation",
		});
		pushToast(
			`Added ${fund.name} (₹${(sipAmount / 1000).toFixed(0)}k/mo) to Basket`,
			"success",
		);
	};

	const getRiskBadgeVariant = (risk: string) => {
		const r = risk.toLowerCase();
		if (r.includes("low")) return "riskLow" as const;
		if (r.includes("moderate")) return "riskModerate" as const;
		return "riskHigh" as const;
	};

	const getCategoryBadgeVariant = (cat: string) => {
		switch (cat) {
			case "Equity":
				return "equity" as const;
			case "Debt":
				return "debt" as const;
			case "Commodities":
				return "commodities" as const;
			case "Hybrid":
				return "hybrid" as const;
			default:
				return "secondary" as const;
		}
	};

	return (
		<Card
			className={`group flex flex-col justify-between transition-all duration-300 ${
				isHighlighted
					? "border-amber-400 ring-4 ring-amber-300/40 shadow-lg scale-[1.01]"
					: inBasket
						? "border-emerald-400/80 ring-2 ring-emerald-100 dark:ring-emerald-950 shadow-xs"
						: "hover:border-slate-300 hover:shadow-md"
			}`}
		>
			<CardHeader className="p-4 pb-2 space-y-2">
				{/* Category & Star Rating */}
				<div className="flex items-center justify-between gap-2">
					<Badge variant={getCategoryBadgeVariant(fund.category)}>
						{fund.sub_category}
					</Badge>
					<div className="flex items-center gap-1">
						<div className="flex text-amber-400">
							{Array.from({ length: fund.rating }).map((_, i) => (
								<Star key={i} className="size-3 fill-current" />
							))}
						</div>
						<span className="text-[10px] text-muted-foreground font-semibold">
							{fund.rating}.0
						</span>
					</div>
				</div>

				{/* Fund Title & AMC */}
				<div>
					<CardTitle className="text-xs group-hover:text-primary transition-colors line-clamp-2 leading-snug">
						{fund.name}
					</CardTitle>
					<p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
						{fund.amc}
					</p>
				</div>
			</CardHeader>

			<CardContent className="p-4 pt-1 space-y-3">
				{/* Core Financial Metrics */}
				<div className="grid grid-cols-3 gap-2 p-2.5 bg-muted/40 rounded-xl border border-border text-center">
					<div>
						<p className="text-[10px] text-muted-foreground font-semibold">3Y CAGR</p>
						<p className="text-xs font-extrabold text-emerald-600">
							+{fund.cagr_3y}%
						</p>
					</div>
					<div>
						<p className="text-[10px] text-muted-foreground font-semibold">TER</p>
						<p className="text-xs font-extrabold text-foreground">{fund.ter}%</p>
					</div>
					<div>
						<p className="text-[10px] text-muted-foreground font-semibold">AUM</p>
						<p className="text-xs font-extrabold text-foreground">
							₹{(fund.aum_crores / 1000).toFixed(1)}k Cr
						</p>
					</div>
				</div>

				{/* Top Holdings Tags */}
				<div>
					<p className="text-[10px] font-bold text-muted-foreground mb-1">
						Top Holdings:
					</p>
					<div className="flex flex-wrap gap-1">
						{fund.top_holdings.slice(0, 3).map((h, i) => (
							<Badge key={i} variant="secondary" className="text-[10px] font-medium">
								{h}
							</Badge>
						))}
					</div>
				</div>

				{/* Risk & Feature Badges */}
				<div className="flex items-center gap-1.5 flex-wrap">
					<Badge variant={getRiskBadgeVariant(fund.risk_level)}>
						{fund.risk_level}
					</Badge>
					{fund.tags.slice(0, 2).map((t, i) => (
						<Badge key={i} variant="tag">
							{t}
						</Badge>
					))}
				</div>
			</CardContent>

			<CardFooter className="p-4 pt-2 flex flex-col gap-2 border-t border-border">
				<div className="flex items-center justify-between w-full text-xs">
					<span className="text-[11px] text-muted-foreground font-semibold">
						Monthly SIP:
					</span>
					<div className="w-36">
						<Select
							value={String(sipAmount)}
							onValueChange={(v) => setSipAmount(Number(v))}
						>
							<SelectTrigger className="h-7 text-[11px] font-bold bg-muted/40">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="10000">₹10,000 / mo</SelectItem>
								<SelectItem value="20000">₹20,000 / mo</SelectItem>
								<SelectItem value="25000">₹25,000 / mo</SelectItem>
								<SelectItem value="35000">₹35,000 / mo</SelectItem>
								<SelectItem value="50000">₹50,000 / mo</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				<Button
					onClick={handleAddSip}
					variant={inBasket ? "success" : "wealth"}
					className="w-full h-8 text-xs font-bold gap-1.5"
				>
					{inBasket ? (
						<>
							<Check className="size-3.5" />
							<span>In Advisory Basket</span>
						</>
					) : (
						<>
							<Plus className="size-3.5" />
							<span>Add to Advisory Basket</span>
						</>
					)}
				</Button>
			</CardFooter>
		</Card>
	);
}
