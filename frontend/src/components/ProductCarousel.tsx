import { useState, useEffect } from "react";
import type { FundProduct } from "@/types";
import { useStore } from "@/store";
import ProductCard from "./ProductCard";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
	type CarouselApi,
} from "@/components/ui/carousel";
import { Sparkles, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProductCarousel({ funds }: { funds: FundProduct[] }) {
	const { visibleFundIds, filter, setFilter } = useStore();
	const [api, setApi] = useState<CarouselApi>();
	const [current, setCurrent] = useState(0);
	const [count, setCount] = useState(0);

	useEffect(() => {
		if (!api) return;
		setCount(api.scrollSnapList().length);
		setCurrent(api.selectedScrollSnap() + 1);

		api.on("select", () => {
			setCurrent(api.selectedScrollSnap() + 1);
		});
	}, [api]);

	// Group funds by category if viewing "All" and no specific search query
	const isAllView = filter.category === "All" && !filter.query && !visibleFundIds;

	const featuredFunds = visibleFundIds
		? funds.filter((f) => visibleFundIds.includes(f.id))
		: funds.filter((f) => f.rating === 5 || f.cagr_3y >= 22).slice(0, 8);

	const equityFunds = funds.filter((f) => f.category === "Equity");
	const debtFunds = funds.filter((f) => f.category === "Debt");
	const hybridFunds = funds.filter((f) => f.category === "Hybrid" || f.category === "Commodities");

	if (!isAllView) {
		// Single focused category carousel
		return (
			<div className="space-y-3">
				{/* Carousel Header with Paging & Controls */}
				<div className="flex items-center justify-between px-1">
					<div>
						<h3 className="text-sm font-bold text-slate-900 dark:text-white">
							{filter.category === "All" ? "Curated Instruments" : `${filter.category} Portfolio`}
						</h3>
						<p className="text-xs text-slate-500 dark:text-slate-400">
							Showing {funds.length} instruments • Page {current} of {count || 1}
						</p>
					</div>

					<div className="flex items-center gap-1">
						{/* Progress Indicator Dots */}
						<div className="hidden sm:flex items-center gap-1 mr-2">
							{Array.from({ length: Math.min(count, 8) }).map((_, i) => (
								<button
									key={i}
									type="button"
									onClick={() => api?.scrollTo(i)}
									className={`size-1.5 rounded-full transition-all ${
										current === i + 1
											? "w-4 bg-amber-500 dark:bg-amber-400"
											: "bg-slate-300 dark:bg-slate-700 hover:bg-slate-400"
									}`}
									aria-label={`Go to slide ${i + 1}`}
								/>
							))}
						</div>
					</div>
				</div>

				{/* Primary Carousel */}
				<Carousel
					setApi={setApi}
					opts={{
						align: "start",
						loop: false,
					}}
					className="w-full relative"
				>
					<CarouselContent className="-ml-3">
						{funds.map((fund) => (
							<CarouselItem
								key={fund.id}
								className="pl-3 basis-full sm:basis-1/2 lg:basis-1/3"
							>
								<ProductCard fund={fund} />
							</CarouselItem>
						))}
					</CarouselContent>
					<div className="flex items-center justify-end gap-2 pt-2">
						<CarouselPrevious className="static translate-y-0 size-8" />
						<CarouselNext className="static translate-y-0 size-8" />
					</div>
				</Carousel>
			</div>
		);
	}

	// Multi-Row Curated Carousel Rails when viewing "All"
	return (
		<div className="space-y-8">
			{/* Rail 1: Top Conviction Picks */}
			<section className="space-y-3">
				<div className="flex items-center justify-between px-1">
					<div className="flex items-center gap-2">
						<div className="size-2 rounded-full bg-amber-400 animate-pulse" />
						<div>
							<h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
								<span>High-Conviction Advisory Picks</span>
								<span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-amber-400/15 text-amber-900 dark:text-amber-300 border border-amber-400/30">
									Top Rated
								</span>
							</h3>
							<p className="text-xs text-slate-500 dark:text-slate-400">
								Highest risk-adjusted alpha for Rahul's growth goals
							</p>
						</div>
					</div>
				</div>

				<Carousel
					opts={{
						align: "start",
						loop: false,
					}}
					className="w-full relative"
				>
					<CarouselContent className="-ml-3">
						{featuredFunds.map((fund) => (
							<CarouselItem
								key={fund.id}
								className="pl-3 basis-full sm:basis-1/2 lg:basis-1/3"
							>
								<ProductCard fund={fund} />
							</CarouselItem>
						))}
					</CarouselContent>
					<div className="flex items-center justify-end gap-2 pt-1.5">
						<CarouselPrevious className="static translate-y-0 size-8" />
						<CarouselNext className="static translate-y-0 size-8" />
					</div>
				</Carousel>
			</section>

			{/* Rail 2: Equity & Growth */}
			{equityFunds.length > 0 && (
				<section className="space-y-3">
					<div className="flex items-center justify-between px-1">
						<div>
							<h3 className="text-sm font-bold text-slate-900 dark:text-white">
								Equity & Capital Appreciation
							</h3>
							<p className="text-xs text-slate-500 dark:text-slate-400">
								Large, Mid, Flexi Cap & Global Tech engines ({equityFunds.length} funds)
							</p>
						</div>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setFilter({ category: "Equity" })}
							className="h-7 px-2.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 hover:bg-amber-400/15 rounded-lg transition-colors gap-1"
						>
							<span>View all Equity</span>
							<ArrowRight className="size-3" />
						</Button>
					</div>

					<Carousel
						opts={{
							align: "start",
							loop: false,
						}}
						className="w-full relative"
					>
						<CarouselContent className="-ml-3">
							{equityFunds.map((fund) => (
								<CarouselItem
									key={fund.id}
									className="pl-3 basis-full sm:basis-1/2 lg:basis-1/3"
								>
									<ProductCard fund={fund} />
								</CarouselItem>
							))}
						</CarouselContent>
						<div className="flex items-center justify-end gap-2 pt-1.5">
							<CarouselPrevious className="static translate-y-0 size-8" />
							<CarouselNext className="static translate-y-0 size-8" />
						</div>
					</Carousel>
				</section>
			)}

			{/* Rail 3: Debt & Yield Stabilization */}
			{debtFunds.length > 0 && (
				<section className="space-y-3">
					<div className="flex items-center justify-between px-1">
						<div>
							<h3 className="text-sm font-bold text-slate-900 dark:text-white">
								Fixed Income & Capital Preservation
							</h3>
							<p className="text-xs text-slate-500 dark:text-slate-400">
								Target Maturity Gilts & Corporate Bond yield ({debtFunds.length} funds)
							</p>
						</div>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setFilter({ category: "Debt" })}
							className="h-7 px-2.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 hover:bg-amber-400/15 rounded-lg transition-colors gap-1"
						>
							<span>View all Debt</span>
							<ArrowRight className="size-3" />
						</Button>
					</div>

					<Carousel
						opts={{
							align: "start",
							loop: false,
						}}
						className="w-full relative"
					>
						<CarouselContent className="-ml-3">
							{debtFunds.map((fund) => (
								<CarouselItem
									key={fund.id}
									className="pl-3 basis-full sm:basis-1/2 lg:basis-1/3"
								>
									<ProductCard fund={fund} />
								</CarouselItem>
							))}
						</CarouselContent>
						<div className="flex items-center justify-end gap-2 pt-1.5">
							<CarouselPrevious className="static translate-y-0 size-8" />
							<CarouselNext className="static translate-y-0 size-8" />
						</div>
					</Carousel>
				</section>
			)}

			{/* Rail 4: Hybrid & Commodities Diversifiers */}
			{hybridFunds.length > 0 && (
				<section className="space-y-3">
					<div className="flex items-center justify-between px-1">
						<div>
							<h3 className="text-sm font-bold text-slate-900 dark:text-white">
								Multi-Asset & Inflation Hedges
							</h3>
							<p className="text-xs text-slate-500 dark:text-slate-400">
								Balanced Advantage, Gold & Silver ETFs ({hybridFunds.length} funds)
							</p>
						</div>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setFilter({ category: "Hybrid" })}
							className="h-7 px-2.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 hover:bg-amber-400/15 rounded-lg transition-colors gap-1"
						>
							<span>View all Multi-Asset</span>
							<ArrowRight className="size-3" />
						</Button>
					</div>

					<Carousel
						opts={{
							align: "start",
							loop: false,
						}}
						className="w-full relative"
					>
						<CarouselContent className="-ml-3">
							{hybridFunds.map((fund) => (
								<CarouselItem
									key={fund.id}
									className="pl-3 basis-full sm:basis-1/2 lg:basis-1/3"
								>
									<ProductCard fund={fund} />
								</CarouselItem>
							))}
						</CarouselContent>
						<div className="flex items-center justify-end gap-2 pt-1.5">
							<CarouselPrevious className="static translate-y-0 size-8" />
							<CarouselNext className="static translate-y-0 size-8" />
						</div>
					</Carousel>
				</section>
			)}
		</div>
	);
}
