import { Search, RotateCcw, SlidersHorizontal } from "lucide-react";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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
	const { filter, setFilter, set, visibleFundIds } = useStore();

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
		<div className="bg-card rounded-2xl border border-border p-4 shadow-xs space-y-3.5">
			{/* Top Row: Search and Sort */}
			<div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
				<div className="relative flex-1">
					<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
					<Input
						type="text"
						value={filter.query}
						onChange={(e) => {
							const q = e.target.value;
							setFilter({ query: q });
							sendAction("filter_products", { query: q || null });
						}}
						placeholder="Search funds, managers, top holdings (e.g. 'Flexi Cap', 'US Tech AI', 'SDL 2030')..."
						className="pl-10 pr-4 bg-muted/40"
					/>
				</div>

				<div className="flex items-center gap-2">
					<div className="w-48">
						<Select
							value={filter.sort}
							onValueChange={(val: any) => setFilter({ sort: val })}
						>
							<SelectTrigger className="bg-muted/40 font-medium">
								<div className="flex items-center gap-1.5 truncate">
									<SlidersHorizontal className="size-3.5 text-muted-foreground shrink-0" />
									<SelectValue placeholder="Sort funds" />
								</div>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="cagr_desc">Highest 3Y CAGR</SelectItem>
								<SelectItem value="rating_desc">Top Star Rating</SelectItem>
								<SelectItem value="ter_asc">Lowest Expense (TER)</SelectItem>
								<SelectItem value="aum_desc">Largest AUM</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{isFiltered && (
						<Button
							variant="outline"
							size="sm"
							onClick={resetFilters}
							className="gap-1 bg-muted/40 text-muted-foreground hover:text-foreground"
						>
							<RotateCcw className="size-3.5" />
							<span>Reset</span>
						</Button>
					)}
				</div>
			</div>

			{/* Subcategory ToggleGroup */}
			<div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
				<span className="text-[11px] font-bold text-muted-foreground px-1 shrink-0">
					Subcategory:
				</span>
				<ToggleGroup
					type="single"
					value={filter.subCategory}
					onValueChange={(val) => {
						if (!val) return;
						setFilter({ subCategory: val });
						sendAction("filter_products", {
							sub_category: val === "All" ? null : val,
						});
					}}
					className="flex items-center gap-1.5 flex-nowrap"
				>
					{SUB_CATEGORIES.map((sub) => (
						<ToggleGroupItem
							key={sub}
							value={sub}
							size="sm"
							variant="subtle"
							className="whitespace-nowrap"
						>
							{sub}
						</ToggleGroupItem>
					))}
				</ToggleGroup>
			</div>

			{/* Risk Filter ToggleGroup */}
			<div className="flex items-center gap-2 overflow-x-auto pb-0.5 text-xs">
				<span className="text-[11px] font-bold text-muted-foreground px-1 shrink-0">
					Riskometer:
				</span>
				<ToggleGroup
					type="single"
					value={filter.risk}
					onValueChange={(val) => {
						if (!val) return;
						setFilter({ risk: val });
						sendAction("filter_products", {
							risk_level: val === "All" ? null : val,
						});
					}}
					className="flex items-center gap-1.5 flex-nowrap"
				>
					{RISK_LEVELS.map((r) => (
						<ToggleGroupItem
							key={r}
							value={r}
							size="sm"
							variant="risk"
							className="whitespace-nowrap"
						>
							{r}
						</ToggleGroupItem>
					))}
				</ToggleGroup>
			</div>
		</div>
	);
}
