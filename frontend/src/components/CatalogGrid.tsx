import { useMemo } from "react";
import { useStore } from "@/store";
import ProductCard from "./ProductCard";
import { Layers, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CatalogGrid() {
	const { funds, visibleFundIds, filter } = useStore();

	const displayedFunds = useMemo(() => {
		let list = [...funds];

		// Filter by AI / Tool-called visible IDs if set
		if (visibleFundIds && visibleFundIds.length > 0) {
			const idSet = new Set(visibleFundIds);
			list = list.filter((f) => idSet.has(f.id));
		}

		// Filter by Category
		if (filter.category && filter.category !== "All") {
			list = list.filter(
				(f) => f.category.toLowerCase() === filter.category.toLowerCase(),
			);
		}

		// Filter by Subcategory
		if (filter.subCategory && filter.subCategory !== "All") {
			list = list.filter((f) =>
				f.sub_category.toLowerCase().includes(filter.subCategory.toLowerCase()),
			);
		}

		// Filter by Risk
		if (filter.risk && filter.risk !== "All") {
			list = list.filter(
				(f) => f.risk_level.toLowerCase() === filter.risk.toLowerCase(),
			);
		}

		// Filter by Query
		if (filter.query) {
			const q = filter.query.toLowerCase();
			list = list.filter(
				(f) =>
					f.name.toLowerCase().includes(q) ||
					f.description.toLowerCase().includes(q) ||
					f.sub_category.toLowerCase().includes(q) ||
					f.top_holdings.some((h) => h.toLowerCase().includes(q)),
			);
		}

		// Sorting
		switch (filter.sort) {
			case "cagr_desc":
				list.sort((a, b) => (b.cagr_3y || 0) - (a.cagr_3y || 0));
				break;
			case "rating_desc":
				list.sort((a, b) => b.rating - a.rating);
				break;
			case "ter_asc":
				list.sort((a, b) => (a.ter || 1) - (b.ter || 1));
				break;
			case "aum_desc":
				list.sort((a, b) => (b.aum_crores || 0) - (a.aum_crores || 0));
				break;
		}

		return list;
	}, [funds, visibleFundIds, filter]);

	return (
		<div className="space-y-4">
			{/* Grid Header */}
			<div className="flex items-center justify-between px-1">
				<div className="flex items-center gap-2">
					<Layers className="size-4 text-muted-foreground" />
					<h2 className="text-sm font-bold text-foreground">
						Product Explorer ({displayedFunds.length} Instruments)
					</h2>
				</div>
				{visibleFundIds && (
					<Badge variant="gold" className="gap-1 font-bold">
						<Sparkles className="size-3" />
						<span>Curated by Ananya</span>
					</Badge>
				)}
			</div>

			{/* Grid Content */}
			{displayedFunds.length === 0 ? (
				<div className="bg-card rounded-2xl border border-border p-12 text-center text-muted-foreground">
					<Layers className="size-9 mx-auto text-muted-foreground/40 mb-3" />
					<p className="font-bold text-foreground">
						No matching investment products found
					</p>
					<p className="text-xs text-muted-foreground mt-1">
						Try adjusting your search query, riskometer setting, or category
						filter.
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
					{displayedFunds.map((fund) => (
						<ProductCard key={fund.id} fund={fund} />
					))}
				</div>
			)}
		</div>
	);
}
