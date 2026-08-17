import { useMemo } from "react";
import { useStore } from "../store";
import ProductCard from "./ProductCard";
import { Layers, Sparkles } from "lucide-react";

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
					<Layers size={18} className="text-slate-500" />
					<h2 className="text-sm font-bold text-slate-800">
						Product Explorer ({displayedFunds.length} Instruments)
					</h2>
				</div>
				{visibleFundIds && (
					<span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
						<Sparkles size={12} />
						<span>Curated by Ananya</span>
					</span>
				)}
			</div>

			{/* Grid Content */}
			{displayedFunds.length === 0 ? (
				<div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
					<Layers size={36} className="mx-auto text-slate-300 mb-3" />
					<p className="font-bold text-slate-700">
						No matching investment products found
					</p>
					<p className="text-xs text-slate-400 mt-1">
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
