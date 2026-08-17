import { useState } from "react";
import {
	Briefcase,
	TrendingUp,
	ChevronDown,
	ShieldAlert,
	Sparkles,
	Layers,
	Activity,
	Lock,
	Sun,
	Moon,
} from "lucide-react";
import { useStore } from "@/store";
import { sendAction } from "@/ws";
import Logo from "./Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export default function TopBar() {
	const {
		basket,
		totalSip,
		activeTab,
		set,
		portfolio,
		profile,
		mandateStatus,
		theme,
		toggleTheme,
	} = useStore();
	const [profileOpen, setProfileOpen] = useState(false);

	const activeUser = portfolio || profile;
	const aum = activeUser?.total_aum_inr || 7500000;
	const aumLakhs = (aum / 100000).toFixed(1);

	return (
		<header className="sticky top-0 z-40 bg-white/90 dark:bg-[#070D18]/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-card-luxury transition-colors">
			<div className="mx-auto max-w-[1700px] px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
				{/* Left Brand Identity */}
				<Logo />

				{/* Center: Studio Canvas Workspace Switcher */}
				<nav className="hidden md:flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-white/5 shadow-inner">
					<button
						type="button"
						onClick={() => set({ activeTab: "explorer" })}
						className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
							activeTab === "explorer"
								? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
								: "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
						}`}
					>
						<Layers className="size-3.5" />
						<span>Explorer</span>
					</button>

					<button
						type="button"
						onClick={() => {
							set({ activeTab: "diagnostics", diagnosticsOpen: true });
							sendAction("get_portfolio_diagnostics");
						}}
						className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
							activeTab === "diagnostics"
								? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
								: "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
						}`}
					>
						<ShieldAlert className="size-3.5" />
						<span>Diagnostics</span>
					</button>

					<button
						type="button"
						onClick={() => {
							set({ activeTab: "simulation", simulationOpen: true });
							sendAction("simulate_portfolio", {
								equity_pct: 65,
								debt_pct: 20,
								gold_pct: 10,
								liquid_pct: 5,
								monthly_sip_inr: 100000,
							});
						}}
						className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
							activeTab === "simulation"
								? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
								: "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
						}`}
					>
						<TrendingUp className="size-3.5" />
						<span>Simulation</span>
					</button>
				</nav>

				{/* Right Tools & Client Snapshot */}
				<div className="flex items-center gap-2">
					{/* Theme Mode Toggle (Obsidian Dark ↔ Porcelain Light) */}
					<Button
						variant="ghost"
						size="iconSm"
						onClick={toggleTheme}
						className="size-9 rounded-lg bg-slate-100 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
						title={
							theme === "dark"
								? "Switch to Porcelain Light Mode"
								: "Switch to Obsidian Dark Mode"
						}
					>
						{theme === "dark" ? (
							<Sun className="size-4 text-amber-400" />
						) : (
							<Moon className="size-4 text-slate-700" />
						)}
					</Button>

					{/* Advisory Basket Trigger */}
					<Button
						onClick={() => {
							set({ basketOpen: true });
							sendAction("view_basket");
						}}
						className="relative flex items-center gap-2 h-9 px-3 rounded-lg bg-slate-100 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all shadow-xs"
						aria-label="Open Advisory Basket"
					>
						<Briefcase className="size-3.5 text-amber-600 dark:text-amber-400" />
						<span className="text-xs font-semibold hidden md:inline">
							Basket
						</span>
						{basket.length > 0 && (
							<span className="grid place-items-center size-4.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold shadow-xs">
								{basket.length}
							</span>
						)}
					</Button>

					{/* Client Profile Snapshot Popover */}
					<Popover open={profileOpen} onOpenChange={setProfileOpen}>
						<PopoverTrigger asChild>
							<Button
								variant="ghost"
								className="flex items-center gap-2 h-9 pl-1.5 pr-2.5 rounded-lg bg-slate-100 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
							>
								<Avatar className="size-6 rounded-md">
									<AvatarFallback className="rounded-md bg-amber-500 text-slate-950 text-[11px] font-bold">
										RS
									</AvatarFallback>
								</Avatar>
								<span className="text-xs font-semibold hidden sm:inline text-slate-800 dark:text-slate-200">
									₹{aumLakhs}L AUM
								</span>
								<ChevronDown
									className={`size-3 text-slate-400 transition-transform duration-200 ${
										profileOpen ? "rotate-180" : ""
									}`}
								/>
							</Button>
						</PopoverTrigger>
						<PopoverContent
							align="end"
							className="w-84 p-4 text-xs space-y-3 bg-white dark:bg-[#0B1323] border-slate-200 dark:border-white/15 text-slate-800 dark:text-slate-200 shadow-2xl backdrop-blur-2xl rounded-2xl"
						>
							<div className="flex items-center gap-3 pb-2">
								<Avatar className="size-10 rounded-xl border border-amber-400/40">
									<AvatarFallback className="rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 font-black text-sm">
										RS
									</AvatarFallback>
								</Avatar>
								<div>
									<p className="font-bold text-sm text-slate-900 dark:text-white">Rahul Sharma</p>
									<p className="text-slate-500 dark:text-slate-400 text-[11px]">
										Engineering Director, Bengaluru
									</p>
								</div>
							</div>

							<Separator className="bg-slate-200 dark:bg-white/10" />

							<div className="space-y-2">
								<div className="flex justify-between items-center">
									<span className="text-slate-500 dark:text-slate-400">Portfolio AUM:</span>
									<span className="font-mono font-bold text-slate-900 dark:text-white text-sm">₹75,00,000</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-slate-500 dark:text-slate-400">Risk Profile:</span>
									<Badge className="bg-amber-400/15 text-amber-900 dark:text-amber-300 border-amber-400/30 text-[10px]">
										Moderately Aggressive
									</Badge>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-slate-500 dark:text-slate-400">Monthly Surplus:</span>
									<span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
										₹1,50,000 / mo
									</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-slate-500 dark:text-slate-400">Active SIPs:</span>
									<span className="font-mono font-bold text-slate-700 dark:text-slate-300">₹60,000 / mo</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-slate-500 dark:text-slate-400">Unallocated Cash:</span>
									<span className="font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-300 dark:border-rose-800/40">
										₹90,000 / mo
									</span>
								</div>
							</div>

							<Separator className="bg-slate-200 dark:bg-white/10" />

							<div>
								<p className="text-[11px] font-bold text-amber-800 dark:text-amber-300 mb-1.5 flex items-center gap-1.5">
									<Activity className="size-3.5" />
									<span>Milestone Targets:</span>
								</p>
								<div className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
									<p className="flex justify-between">
										<span>Children Education:</span>
										<span className="font-mono text-slate-800 dark:text-slate-200">₹50L (2032)</span>
									</p>
									<p className="flex justify-between">
										<span>Early Retirement:</span>
										<span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">₹5 Cr (2042)</span>
									</p>
								</div>
							</div>
						</PopoverContent>
					</Popover>
				</div>
			</div>
		</header>
	);
}

