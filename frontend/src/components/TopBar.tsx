import { useState } from "react";
import {
	Briefcase,
	TrendingUp,
	ChevronDown,
	ShieldAlert,
	Sparkles,
} from "lucide-react";
import { useStore } from "@/store";
import { sendAction } from "@/ws";
import Logo from "./Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const CATEGORIES: Array<{ key: string; label: string }> = [
	{ key: "All", label: "All Instruments" },
	{ key: "Equity", label: "Equity & Growth" },
	{ key: "Debt", label: "Debt & Fixed Income" },
	{ key: "Commodities", label: "Gold & Commodities" },
	{ key: "Hybrid", label: "Multi-Asset & Hybrid" },
];

export default function TopBar() {
	const { basket, totalSip, filter, setFilter, set, portfolio, profile } =
		useStore();
	const [profileOpen, setProfileOpen] = useState(false);

	const activeUser = portfolio || profile;
	const aum = activeUser?.total_aum_inr || 7500000;
	const aumLakhs = (aum / 100000).toFixed(1);

	return (
		<header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border shadow-xs">
			<div className="mx-auto max-w-[1650px] px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
				<Logo />

				{/* Category Navigation Tabs */}
				<nav className="hidden lg:flex items-center">
					<Tabs
						value={filter.category}
						onValueChange={(val) => {
							setFilter({ category: val, subCategory: "All" });
							sendAction("filter_products", {
								category: val === "All" ? null : val,
							});
						}}
					>
						<TabsList className="bg-muted/80 p-1 rounded-xl">
							{CATEGORIES.map((c) => (
								<TabsTrigger key={c.key} value={c.key} className="text-xs">
									{c.label}
								</TabsTrigger>
							))}
						</TabsList>
					</Tabs>
				</nav>

				{/* Right Tools & Profile */}
				<div className="flex items-center gap-2.5">
					{/* Diagnostics Quick Trigger */}
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							set({ diagnosticsOpen: true });
							sendAction("get_portfolio_diagnostics");
						}}
						className="hidden sm:inline-flex border-amber-300/80 bg-amber-50/70 text-amber-900 hover:bg-amber-100 dark:bg-amber-950/20 dark:text-amber-200"
					>
						<ShieldAlert className="size-3.5 text-amber-600 mr-1.5" />
						<span>Diagnostics</span>
					</Button>

					{/* Simulation Quick Trigger */}
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							set({ simulationOpen: true });
							sendAction("simulate_portfolio", {
								equity_pct: 65,
								debt_pct: 20,
								gold_pct: 10,
								liquid_pct: 5,
								monthly_sip_inr: 100000,
							});
						}}
						className="hidden sm:inline-flex border-blue-200 bg-blue-50/70 text-blue-900 hover:bg-blue-100 dark:bg-blue-950/20 dark:text-blue-200"
					>
						<TrendingUp className="size-3.5 text-blue-600 mr-1.5" />
						<span>Simulate Goals</span>
					</Button>

					{/* Advisory Basket Trigger */}
					<Button
						variant="wealth"
						onClick={() => {
							set({ basketOpen: true });
							sendAction("view_basket");
						}}
						className="relative flex items-center gap-2.5 h-10 px-4 rounded-xl"
						aria-label="Open Advisory Basket"
					>
						<Briefcase className="size-4 text-amber-300" />
						<div className="text-left hidden md:block leading-none">
							<p className="text-[10px] text-slate-300 font-medium">
								Advisory Basket
							</p>
							<p className="text-xs font-bold mt-0.5">
								{totalSip > 0
									? `₹${(totalSip / 1000).toFixed(0)}k/mo`
									: `${basket.length} Funds`}
							</p>
						</div>
						{basket.length > 0 && (
							<span className="grid place-items-center size-5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
								{basket.length}
							</span>
						)}
					</Button>

					{/* Client Profile Snapshot Popover */}
					<Popover open={profileOpen} onOpenChange={setProfileOpen}>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								className="flex items-center gap-2 h-10 pl-2 pr-3 rounded-xl bg-card border-border hover:bg-muted"
							>
								<Avatar className="size-7 rounded-lg">
									<AvatarFallback className="rounded-lg bg-emerald-600 text-white text-xs font-bold">
										RS
									</AvatarFallback>
								</Avatar>
								<div className="text-left hidden sm:block leading-none">
									<p className="text-xs font-bold truncate max-w-[110px]">
										{activeUser?.name || "Rahul Sharma"}
									</p>
									<p className="text-[10px] font-semibold text-emerald-700 mt-0.5">
										₹{aumLakhs}L AUM
									</p>
								</div>
								<ChevronDown
									className={`size-3.5 text-muted-foreground transition-transform duration-200 ${
										profileOpen ? "rotate-180" : ""
									}`}
								/>
							</Button>
						</PopoverTrigger>
						<PopoverContent align="end" className="w-80 p-4 text-xs space-y-3">
							<div className="flex items-center gap-3 pb-2">
								<Avatar className="size-10 rounded-xl">
									<AvatarFallback className="rounded-xl bg-emerald-600 text-white font-bold text-sm">
										RS
									</AvatarFallback>
								</Avatar>
								<div>
									<p className="font-bold text-sm">Rahul Sharma</p>
									<p className="text-muted-foreground text-[11px]">
										Engineering Director, Bengaluru
									</p>
								</div>
							</div>

							<Separator />

							<div className="space-y-1.5">
								<div className="flex justify-between">
									<span className="text-muted-foreground">Portfolio AUM:</span>
									<span className="font-bold">₹75,00,000</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-muted-foreground">Risk Profile:</span>
									<Badge variant="riskModerate">Moderately Aggressive</Badge>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Monthly Surplus:</span>
									<span className="font-bold text-emerald-700">
										₹1,50,000 / mo
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Active SIPs:</span>
									<span className="font-bold text-foreground">₹60,000 / mo</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Unallocated Cash:</span>
									<span className="font-bold text-rose-600">₹90,000 / mo</span>
								</div>
							</div>

							<Separator />

							<div>
								<p className="text-[11px] font-bold text-foreground mb-1">
									Target Goals:
								</p>
								<p className="text-[11px] text-muted-foreground">
									• Children's Education: ₹50L (2032)
								</p>
								<p className="text-[11px] text-muted-foreground">
									• Early Retirement: ₹5 Cr (2042)
								</p>
							</div>
						</PopoverContent>
					</Popover>
				</div>
			</div>
		</header>
	);
}
