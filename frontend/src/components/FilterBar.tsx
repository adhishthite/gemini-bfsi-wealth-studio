import {
	Search,
	RotateCcw,
	SlidersHorizontal,
	Award,
	Percent,
	Layers,
} from "lucide-react";
import { useStore } from "../store";
import { sendAction } from "../ws";

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
	"Target Date Retirement",
];

const RISK_LEVELS = [
	"All",
	"Low",
	"Moderate",
	"Moderately High",
	"High",
	"Very High",
];

export default function FilterBar() {
	const { filter, setFilter, set, visibleFundIds, funds } = useStore();

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
		<div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3.5">
			{/* Top Row: Search and Sort */}
			<div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
				<div className="relative flex-1">
					<Search
						size={16}
						className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
					/>
					<input
						type="text"
						value={filter.query}
						onChange={(e) => {
							const q = e.target.value;
							setFilter({ query: q });
							sendAction("filter_products", { query: q || null });
						}}
						placeholder="Search funds, managers, top holdings (e.g. 'Flexi Cap', 'US Tech AI', 'SDL 2030')..."
						className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B2545]/20 focus:border-[#0B2545]"
					/>
				</div>

				<div className="flex items-center gap-2">
					<div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600">
						<SlidersHorizontal size={14} className="text-slate-400" />
						<span className="font-semibold text-slate-500">Sort:</span>
						<select
							value={filter.sort}
							onChange={(e) => setFilter({ sort: e.target.value as any })}
							className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
						>
							<option value="cagr_desc">Highest 3Y CAGR</option>
							<option value="rating_desc">Top Star Rating</option>
							<option value="ter_asc">Lowest Expense (TER)</option>
							<option value="aum_desc">Largest AUM</option>
						</select>
					</div>

					{isFiltered && (
						<button
							onClick={resetFilters}
							className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition"
						>
							<RotateCcw size={13} />
							<span>Reset</span>
						</button>
					)}
				</div>
			</div>

			{/* Subcategory Pills */}
			<div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
				<span className="font-bold text-slate-400 px-1 whitespace-nowrap">
					Subcategory:
				</span>
				{SUB_CATEGORIES.map((sub) => {
					const active = filter.subCategory === sub;
					return (
						<button
							key={sub}
							onClick={() => {
								setFilter({ subCategory: sub });
								sendAction("filter_products", {
									sub_category: sub === "All" ? null : sub,
								});
							}}
							className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
								active
									? "bg-slate-900 text-white font-bold shadow-xs"
									: "bg-slate-100 text-slate-600 hover:bg-slate-200"
							}`}
						>
							{sub}
						</button>
					);
				})}
			</div>

			{/* Risk Filter Pills */}
			<div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px]">
				<span className="font-bold text-slate-400 px-1 whitespace-nowrap">
					Riskometer:
				</span>
				{RISK_LEVELS.map((r) => {
					const active = filter.risk === r;
					return (
						<button
							key={r}
							onClick={() => {
								setFilter({ risk: r });
								sendAction("filter_products", {
									risk_level: r === "All" ? null : r,
								});
							}}
							className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
								active
									? "bg-amber-600 text-white font-bold"
									: "bg-slate-100 text-slate-600 hover:bg-slate-200"
							}`}
						>
							{r}
						</button>
					);
				})}
			</div>
		</div>
	);
}
