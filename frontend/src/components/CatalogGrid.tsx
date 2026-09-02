import { useMemo } from "react";
import { useStore } from "@/store";
import InstrumentCard from "./InstrumentCard";
import InstrumentTable from "./InstrumentTable";
import InstrumentCarousel from "./InstrumentCarousel";

export default function CatalogGrid() {
	const { funds, visibleFundIds, filter, explorerView } = useStore();

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

	if (displayedFunds.length === 0) {
		return (
			<div className="paper p-12 text-center">
				<h3 className="doc-title text-xl text-ink-strong">
					No instruments match this mandate
				</h3>
				<p className="mx-auto mt-2 max-w-md text-xs text-ink-muted">
					Widen the category, risk band or search term to rebuild the shortlist.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{explorerView === "carousel" ? (
				<InstrumentCarousel funds={displayedFunds} />
			) : explorerView === "matrix" ? (
				<InstrumentTable funds={displayedFunds} />
			) : (
				<div className="grid grid-cols-1 gap-rhythm sm:grid-cols-2 xl:grid-cols-3">
					{displayedFunds.map((fund) => (
						<InstrumentCard key={fund.id} fund={fund} />
					))}
				</div>
			)}
		</div>
	);
}


