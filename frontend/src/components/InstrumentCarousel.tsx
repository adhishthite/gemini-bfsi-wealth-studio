import { useState, useEffect } from "react";
import type { FundProduct } from "@/types";
import { useStore } from "@/store";
import InstrumentCard from "./InstrumentCard";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
	type CarouselApi,
} from "@/components/ui/carousel";
import { ArrowRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { sendAction } from "@/ws";

const NAV_BUTTON =
	"static size-8 translate-y-0 rounded-lg border-rule bg-paper-sheet text-ink hover:border-rule-strong hover:bg-paper-sunken";

const SLIDE = "pl-3 basis-full sm:basis-1/2 lg:basis-1/3";

/** One shortlist rail: a document heading, a quiet note, and the instruments. */
function Rail({
	title,
	note,
	funds,
	action,
}: {
	title: string;
	note: string;
	funds: FundProduct[];
	action?: React.ReactNode;
}) {
	return (
		<section className="space-y-3">
			<div className="flex items-end justify-between gap-4 px-1">
				<div>
					<h3 className="doc-title text-lg text-ink-strong">{title}</h3>
					<p className="mt-1 text-xs text-ink-muted">{note}</p>
				</div>
				{action}
			</div>

			<Carousel
				opts={{ align: "start", loop: false }}
				className="relative w-full"
			>
				<CarouselContent className="-ml-3">
					{funds.map((fund) => (
						<CarouselItem key={fund.id} className={SLIDE}>
							<InstrumentCard fund={fund} />
						</CarouselItem>
					))}
				</CarouselContent>
				<div className="flex items-center justify-end gap-2 pt-1.5">
					<CarouselPrevious className={NAV_BUTTON} />
					<CarouselNext className={NAV_BUTTON} />
				</div>
			</Carousel>
		</section>
	);
}

export default function InstrumentCarousel({
	funds,
}: {
	funds: FundProduct[];
}) {
	const { visibleFundIds, filter, setFilter } = useStore();
	const [api, setApi] = useState<CarouselApi>();
	const [current, setCurrent] = useState(0);
	const [count, setCount] = useState(0);

	useEffect(() => {
		if (!api) return;
		api.scrollTo(0);
		setCount(api.scrollSnapList().length);
		setCurrent(1);

		api.on("select", () => {
			setCurrent(api.selectedScrollSnap() + 1);
		});
	}, [api, visibleFundIds, funds]);

	// Group funds by category when nothing narrower has been asked for
	const isAllView =
		filter.category === "All" && !filter.query && !visibleFundIds;

	const featuredFunds = visibleFundIds
		? funds.filter((f) => visibleFundIds.includes(f.id))
		: funds.filter((f) => f.rating === 5 || f.cagr_3y >= 22).slice(0, 8);

	const equityFunds = funds.filter((f) => f.category === "Equity");
	const debtFunds = funds.filter((f) => f.category === "Debt");
	const hybridFunds = funds.filter(
		(f) => f.category === "Hybrid" || f.category === "Commodities",
	);

	const viewAll = (category: string) => {
		setFilter({ category, subCategory: "All" });
		useStore.getState().set({ visibleFundIds: null });
		sendAction("filter_products", { category });
	};

	const viewAllButton = (label: string, category: string) => (
		<Button
			variant="ghost"
			size="sm"
			onClick={() => viewAll(category)}
			className="h-8 gap-1.5 rounded-lg px-3 text-xs font-semibold text-ink-muted transition-colors hover:bg-paper-sunken hover:text-ink-strong"
		>
			<span>{label}</span>
			<ArrowRight className="size-3.5" />
		</Button>
	);

	if (!isAllView) {
		// Single focused shortlist
		return (
			<div className="space-y-3">
				<div className="flex items-end justify-between gap-4 px-1">
					<div>
						<h3 className="doc-title text-lg text-ink-strong">
							{filter.category === "All"
								? "Shortlist"
								: `${filter.category} shortlist`}
						</h3>
						<p className="mt-1 text-xs tabular-nums text-ink-muted">
							{funds.length} instruments · Page {current} of {count || 1}
						</p>
					</div>

					{/* Position indicator */}
					<div className="hidden items-center gap-1.5 pb-1 sm:flex">
						{Array.from({ length: Math.min(count, 8) }).map((_, i) => (
							<button
								key={i}
								type="button"
								onClick={() => api?.scrollTo(i)}
								className={`h-1.5 rounded-full transition-all ${
									current === i + 1
										? "w-5 bg-ink-strong"
										: "w-1.5 bg-ink-faint hover:bg-ink-muted"
								}`}
								aria-label={`Go to page ${i + 1}`}
							/>
						))}
					</div>
				</div>

				<Carousel
					setApi={setApi}
					opts={{ align: "start", loop: false }}
					className="relative w-full"
				>
					<CarouselContent className="-ml-3">
						{funds.map((fund) => (
							<CarouselItem key={fund.id} className={SLIDE}>
								<InstrumentCard fund={fund} />
							</CarouselItem>
						))}
					</CarouselContent>
					<div className="flex items-center justify-end gap-2 pt-2">
						<CarouselPrevious className={NAV_BUTTON} />
						<CarouselNext className={NAV_BUTTON} />
					</div>
				</Carousel>
			</div>
		);
	}

	// Curated rails across the whole universe
	return (
		<div className="space-y-8">
			<Rail
				title="Recommended for this mandate"
				note="Strongest risk-adjusted return against the growth goals on file"
				funds={featuredFunds}
			/>

			{equityFunds.length > 0 && (
				<Rail
					title="Equity and capital appreciation"
					note={`Large, mid, flexi cap and global technology · ${equityFunds.length} instruments`}
					funds={equityFunds}
					action={viewAllButton("All equity", "Equity")}
				/>
			)}

			{debtFunds.length > 0 && (
				<Rail
					title="Fixed income and capital preservation"
					note={`Target maturity gilts and corporate bond yield · ${debtFunds.length} instruments`}
					funds={debtFunds}
					action={viewAllButton("All fixed income", "Debt")}
				/>
			)}

			{hybridFunds.length > 0 && (
				<Rail
					title="Multi-asset and inflation hedges"
					note={`Balanced advantage, gold and silver ETFs · ${hybridFunds.length} instruments`}
					funds={hybridFunds}
					action={viewAllButton("All multi-asset", "Hybrid")}
				/>
			)}
		</div>
	);
}
