import { useState } from "react";
import { Search, RotateCcw, SlidersHorizontal, LayoutGrid, TableProperties, Filter, GalleryHorizontal } from "lucide-react";
import { useStore } from "@/store";
import { sendAction } from "@/ws";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

const CATEGORIES = [
	{ key: "All", label: "All" },
	{ key: "Equity", label: "Equity" },
	{ key: "Debt", label: "Debt" },
	{ key: "Commodities", label: "Gold & Comms" },
	{ key: "Hybrid", label: "Hybrid" },
];

const SUB_CATEGORIES = [
	"All",
	"Large Cap",
	"Flexi Cap",
	"Mid Cap",
	"Small Cap",
	"Sectoral / Tech",
	"Corporate Bond",
	"10Y Gilt",
	"Gold ETF",
	"Balanced Advantage (BAF)",
	"Multi-Asset Allocation",
];

const RISK_LEVELS = ["All", "Low", "Moderate", "Moderately High", "High", "Very High"];

export default function FilterBar() {
	const { filter, setFilter, set, visibleFundIds, explorerView } = useStore();
	const [filterOpen, setFilterOpen] = useState(false);

	const resetFilters = () => {
		setFilter({
			category: "All",
			subCategory: "All",
			risk: "All",
			sort: "cagr_desc",
			query: "",
		});
		set({ visibleFundIds: null });
		sendAction("filter_products", {});
	};

	const isFiltered =
		filter.category !== "All" ||
		filter.subCategory !== "All" ||
		filter.risk !== "All" ||
		filter.query !== "" ||
		visibleFundIds !== null;

	return (
		<div className="bg-white/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-white/[0.06] rounded-xl p-2.5 shadow-xs backdrop-blur-md">
			<div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
				{/* Search Input */}
				<div className="relative flex-1 w-full sm:w-auto min-w-[220px]">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
					<Input
						type="text"
						value={filter.query}
						onChange={(e) => {
							const q = e.target.value;
							setFilter({ query: q });
							sendAction("filter_products", { query: q || null });
						}}
						placeholder="Search funds, managers, tags..."
						className="pl-9 pr-3 bg-slate-100/80 dark:bg-slate-950/50 border-slate-200/80 dark:border-white/[0.06] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-amber-400/50 rounded-lg text-xs h-8.5"
					/>
				</div>

				{/* Primary Category Quick Switcher (Minimalist Segment Tabs) */}
				<div className="flex items-center gap-1 overflow-x-auto scrollbar-none p-0.5 bg-slate-100/70 dark:bg-slate-950/60 rounded-lg border border-slate-200/60 dark:border-white/[0.04] w-full sm:w-auto">
					{CATEGORIES.map((c) => {
						const active = filter.category === c.key;
						return (
							<button
								key={c.key}
								type="button"
								onClick={() => {
									setFilter({ category: c.key, subCategory: "All" });
									set({ visibleFundIds: null });
									sendAction("filter_products", {
										category: c.key === "All" ? null : c.key,
									});
								}}
								className={`px-3 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
									active
										? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
										: "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
								}`}
							>
								{c.label}
							</button>
						);
					})}
				</div>

				{/* Right Controls: Filter Popover + Sort + Grid/Table Toggle */}
				<div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
					{/* Advanced Filter Popover */}
					<Popover open={filterOpen} onOpenChange={setFilterOpen}>
						<PopoverTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className={`h-8.5 px-2.5 text-xs font-medium rounded-lg border gap-1.5 ${
									filter.subCategory !== "All" || filter.risk !== "All"
										? "bg-amber-400/10 text-amber-900 dark:text-amber-300 border-amber-400/30"
										: "bg-slate-100/80 dark:bg-slate-950/50 border-slate-200/80 dark:border-white/[0.06] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
								}`}
							>
								<Filter className="size-3" />
								<span>Filters</span>
								{(filter.subCategory !== "All" || filter.risk !== "All") && (
									<span className="size-1.5 rounded-full bg-amber-400" />
								)}
							</Button>
						</PopoverTrigger>
						<PopoverContent
							align="end"
							className="w-72 p-3.5 space-y-3 bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10 text-xs shadow-xl rounded-xl"
						>
							<div className="space-y-1.5">
								<p className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
									Subcategory
								</p>
								<select
									value={filter.subCategory}
									onChange={(e) => {
										const val = e.target.value;
										setFilter({ subCategory: val });
										sendAction("filter_products", {
											sub_category: val === "All" ? null : val,
										});
									}}
									className="w-full h-8 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-2 text-slate-800 dark:text-slate-200 font-medium"
								>
									{SUB_CATEGORIES.map((s) => (
										<option key={s} value={s}>
											{s}
										</option>
									))}
								</select>
							</div>

							<div className="space-y-1.5">
								<p className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
									Risk Level
								</p>
								<select
									value={filter.risk}
									onChange={(e) => {
										const val = e.target.value;
										setFilter({ risk: val });
										sendAction("filter_products", {
											risk_level: val === "All" ? null : val,
										});
									}}
									className="w-full h-8 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-2 text-slate-800 dark:text-slate-200 font-medium"
								>
									{RISK_LEVELS.map((r) => (
										<option key={r} value={r}>
											{r}
										</option>
									))}
								</select>
							</div>

							{isFiltered && (
								<Button
									variant="ghost"
									size="sm"
									onClick={resetFilters}
									className="w-full h-7 text-[11px] text-slate-500 hover:text-rose-500"
								>
									Reset all filters
								</Button>
							)}
						</PopoverContent>
					</Popover>

					{/* Sort Select */}
					<div className="w-36">
						<Select
							value={filter.sort}
							onValueChange={(val: any) => setFilter({ sort: val })}
						>
							<SelectTrigger className="bg-slate-100/80 dark:bg-slate-950/50 border-slate-200/80 dark:border-white/[0.06] text-slate-700 dark:text-slate-300 h-8.5 rounded-lg text-xs font-medium">
								<div className="flex items-center gap-1 truncate">
									<SlidersHorizontal className="size-3 text-slate-400 shrink-0" />
									<SelectValue placeholder="Sort" />
								</div>
							</SelectTrigger>
							<SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 text-xs">
								<SelectItem value="cagr_desc">3Y CAGR (High)</SelectItem>
								<SelectItem value="rating_desc">Rating (High)</SelectItem>
								<SelectItem value="ter_asc">TER (Lowest)</SelectItem>
								<SelectItem value="aum_desc">AUM (Largest)</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* View Mode Toggle: Carousel | Grid | Matrix */}
					<div className="flex items-center bg-slate-100/80 dark:bg-slate-950/60 p-0.5 rounded-lg border border-slate-200/60 dark:border-white/[0.04]">
						<button
							type="button"
							onClick={() => set({ explorerView: "carousel" })}
							className={`p-1.5 rounded-md transition-all ${
								explorerView === "carousel"
									? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
									: "text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
							}`}
							title="Curated Carousel Rails"
						>
							<GalleryHorizontal className="size-3.5" />
						</button>
						<button
							type="button"
							onClick={() => set({ explorerView: "grid" })}
							className={`p-1.5 rounded-md transition-all ${
								explorerView === "grid"
									? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
									: "text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
							}`}
							title="Grid Cards"
						>
							<LayoutGrid className="size-3.5" />
						</button>
						<button
							type="button"
							onClick={() => set({ explorerView: "matrix" })}
							className={`p-1.5 rounded-md transition-all ${
								explorerView === "matrix"
									? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
									: "text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
							}`}
							title="Matrix Table"
						>
							<TableProperties className="size-3.5" />
						</button>
					</div>

					{isFiltered && (
						<Button
							variant="ghost"
							size="iconSm"
							onClick={resetFilters}
							className="size-8.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg"
							title="Reset filters"
						>
							<RotateCcw className="size-3.5" />
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}


