import { useState, type ReactNode } from "react";
import {
	GalleryHorizontal,
	LayoutGrid,
	Search,
	SlidersHorizontal,
	TableProperties,
} from "lucide-react";
import { useStore } from "@/store";
import { sendAction } from "@/ws";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

/* The one axis that stays on the surface — it is what Ananya narrates. */
const CATEGORIES = [
	{ key: "All", label: "All" },
	{ key: "Equity", label: "Equity" },
	{ key: "Debt", label: "Debt" },
	{ key: "Commodities", label: "Commodities" },
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

const RISK_LEVELS = [
	"All",
	"Low",
	"Moderate",
	"Moderately High",
	"High",
	"Very High",
];

const DEFAULT_SORT = "cagr_desc";

const SORTS = [
	{ key: "cagr_desc" as const, label: "Highest 3Y CAGR" },
	{ key: "rating_desc" as const, label: "Highest rating" },
	{ key: "ter_asc" as const, label: "Lowest expense ratio" },
	{ key: "aum_desc" as const, label: "Largest AUM" },
];

const VIEWS = [
	{ key: "carousel" as const, label: "Curated", Icon: GalleryHorizontal },
	{ key: "grid" as const, label: "Cards", Icon: LayoutGrid },
	{ key: "matrix" as const, label: "Comparison", Icon: TableProperties },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
	return (
		<section className="border-b border-rule px-5 py-4 last:border-b-0">
			<p className="label mb-2.5">{title}</p>
			{children}
		</section>
	);
}

function OptionRow({
	selected,
	onClick,
	children,
}: {
	selected: boolean;
	onClick: () => void;
	children: ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`rounded-lg border px-3 py-2 text-left text-xs leading-snug transition-colors ${
				selected
					? "border-rule-strong bg-paper-sunken font-semibold text-ink-strong"
					: "border-transparent text-ink-muted hover:bg-paper-sunken hover:text-ink"
			}`}
		>
			{children}
		</button>
	);
}

export default function FilterBar() {
	const { filter, setFilter, set, visibleFundIds, explorerView } = useStore();
	const [refineOpen, setRefineOpen] = useState(false);

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

	/* Refinements held behind the trigger. Counted so the room can see that
		 state changed without the controls being on screen. */
	const refineCount = [
		filter.subCategory !== "All",
		filter.risk !== "All",
		filter.sort !== DEFAULT_SORT,
	].filter(Boolean).length;

	return (
		<div className="reveal reveal-1 flex flex-col gap-3 border-b border-rule pb-3.5 sm:flex-row sm:items-center sm:gap-4">
			{/* Search */}
			<div className="relative w-full sm:max-w-xs">
				<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
				<input
					type="text"
					value={filter.query}
					onChange={(e) => {
						const q = e.target.value;
						setFilter({ query: q });
						sendAction("filter_products", { query: q || null });
					}}
					placeholder="Search funds, managers or ISIN"
					className="paper-sunken h-10 w-full rounded-lg pl-9 pr-3 text-sm text-ink transition-colors placeholder:text-ink-faint focus-visible:border-rule-strong focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
				/>
			</div>

			{/* Asset class — the single segmented control on the surface */}
			<div className="scrollbar-none flex items-center gap-0.5 overflow-x-auto rounded-lg border border-rule bg-paper-sunken p-1">
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
							className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs transition-colors ${
								active
									? "bg-paper-sheet font-semibold text-ink-strong shadow-sheet"
									: "font-medium text-ink-muted hover:text-ink"
							}`}
						>
							{c.label}
						</button>
					);
				})}
			</div>

			{/* Everything else lives behind one quiet affordance */}
			<div className="sm:ml-auto">
				<Popover open={refineOpen} onOpenChange={setRefineOpen}>
					<PopoverTrigger asChild>
						<button
							type="button"
							className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-rule bg-paper-sheet px-4 text-xs font-medium text-ink-muted transition-colors hover:border-rule-strong hover:text-ink focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring sm:w-auto"
						>
							<SlidersHorizontal className="size-4 text-ink-faint" />
							<span>Refine</span>
							{refineCount > 0 && (
								<span className="font-semibold tabular-nums text-ink-strong">
									&middot; {refineCount}
								</span>
							)}
						</button>
					</PopoverTrigger>
					<PopoverContent
						align="end"
						sideOffset={8}
						className="w-[min(92vw,30rem)] rounded-lg border-rule bg-paper-sheet p-0 shadow-raise"
					>
						<div className="flex items-center justify-between border-b border-rule px-5 py-3.5">
							<p className="label-strong">Refine</p>
							<button
								type="button"
								onClick={resetFilters}
								className={`text-xs font-medium underline-offset-4 transition-colors hover:underline ${
									isFiltered
										? "text-ink-muted hover:text-ink-strong"
										: "text-ink-faint hover:text-ink"
								}`}
							>
								Clear all
							</button>
						</div>

						<div className="scrollbar-none max-h-[70vh] overflow-y-auto">
							<Section title="Strategy">
								<div className="grid grid-cols-2 gap-1">
									{SUB_CATEGORIES.map((s) => (
										<OptionRow
											key={s}
											selected={filter.subCategory === s}
											onClick={() => {
												setFilter({ subCategory: s });
												sendAction("filter_products", {
													sub_category: s === "All" ? null : s,
												});
											}}
										>
											{s}
										</OptionRow>
									))}
								</div>
							</Section>

							<Section title="Risk grade">
								<div className="grid grid-cols-2 gap-1">
									{RISK_LEVELS.map((r) => (
										<OptionRow
											key={r}
											selected={filter.risk === r}
											onClick={() => {
												setFilter({ risk: r });
												sendAction("filter_products", {
													risk_level: r === "All" ? null : r,
												});
											}}
										>
											{r}
										</OptionRow>
									))}
								</div>
							</Section>

							<Section title="Order by">
								<div className="grid grid-cols-2 gap-1">
									{SORTS.map((s) => (
										<OptionRow
											key={s.key}
											selected={filter.sort === s.key}
											onClick={() => setFilter({ sort: s.key })}
										>
											{s.label}
										</OptionRow>
									))}
								</div>
							</Section>

							<Section title="Layout">
								<div className="grid grid-cols-3 gap-1">
									{VIEWS.map(({ key, label, Icon }) => (
										<button
											key={key}
											type="button"
											onClick={() => set({ explorerView: key })}
											className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs transition-colors ${
												explorerView === key
													? "border-rule-strong bg-paper-sunken font-semibold text-ink-strong"
													: "border-transparent text-ink-muted hover:bg-paper-sunken hover:text-ink"
											}`}
										>
											<Icon className="size-4" />
											{label}
										</button>
									))}
								</div>
							</Section>
						</div>
					</PopoverContent>
				</Popover>
			</div>
		</div>
	);
}
