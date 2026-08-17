import { useState } from "react";
import {
	Briefcase,
	PieChart,
	TrendingUp,
	UserCheck,
	ChevronDown,
	ShieldAlert,
	Wallet,
	Sparkles,
} from "lucide-react";
import { useStore } from "../store";
import { sendAction } from "../ws";
import Logo from "./Logo";
import type { FundCategory } from "../types";

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
		<header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
			<div className="mx-auto max-w-[1600px] px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
				<Logo />

				{/* Category Navigation Pills */}
				<nav className="hidden lg:flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
					{CATEGORIES.map((c) => {
						const active = filter.category === c.key;
						return (
							<button
								key={c.key}
								onClick={() => {
									setFilter({ category: c.key, subCategory: "All" });
									sendAction("filter_products", {
										category: c.key === "All" ? null : c.key,
									});
								}}
								className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
									active
										? "bg-[#0B2545] text-white shadow-sm"
										: "text-slate-600 hover:text-slate-900 hover:bg-white"
								}`}
							>
								{c.label}
							</button>
						);
					})}
				</nav>

				{/* Right Tools & Profile */}
				<div className="flex items-center gap-2.5">
					{/* Diagnostics Quick Trigger */}
					<button
						onClick={() => {
							set({ diagnosticsOpen: true });
							sendAction("get_portfolio_diagnostics");
						}}
						className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold hover:bg-amber-100 transition"
					>
						<ShieldAlert size={14} className="text-amber-600" />
						<span>Diagnostics</span>
					</button>

					{/* Simulation Quick Trigger */}
					<button
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
						className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold hover:bg-blue-100 transition"
					>
						<TrendingUp size={14} className="text-blue-600" />
						<span>Simulate Goals</span>
					</button>

					{/* Advisory Basket Trigger */}
					<button
						onClick={() => {
							set({ basketOpen: true });
							sendAction("view_basket");
						}}
						className="relative flex items-center gap-2 h-10 px-3.5 rounded-xl bg-gradient-to-r from-[#0B2545] to-[#134074] text-white shadow-sm hover:opacity-95 transition"
						aria-label="Open Advisory Basket"
					>
						<Briefcase size={16} className="text-amber-300" />
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
							<span className="grid place-items-center h-5 w-5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black">
								{basket.length}
							</span>
						)}
					</button>

					{/* Client Profile Snapshot Pill */}
					<div className="relative">
						<button
							onClick={() => setProfileOpen((v) => !v)}
							className="flex items-center gap-2 h-10 pl-2 pr-3 rounded-xl bg-slate-100 border border-slate-200 hover:border-slate-300 transition"
						>
							<div className="h-7 w-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
								RS
							</div>
							<div className="text-left hidden sm:block leading-none">
								<p className="text-xs font-bold text-slate-900 truncate max-w-[110px]">
									{activeUser?.name || "Rahul Sharma"}
								</p>
								<p className="text-[10px] font-semibold text-emerald-700 mt-0.5">
									₹{aumLakhs}L AUM
								</p>
							</div>
							<ChevronDown
								size={14}
								className={`text-slate-400 transition ${profileOpen ? "rotate-180" : ""}`}
							/>
						</button>

						{profileOpen && (
							<>
								<div
									className="fixed inset-0 z-40"
									onClick={() => setProfileOpen(false)}
								/>
								<div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 text-xs">
									<div className="flex items-center gap-3 pb-3 border-b border-slate-100">
										<div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-sm font-bold">
											RS
										</div>
										<div>
											<p className="font-bold text-slate-900 text-sm">
												Rahul Sharma
											</p>
											<p className="text-slate-500 text-[11px]">
												Engineering Director, Bengaluru
											</p>
										</div>
									</div>

									<div className="py-2.5 space-y-1.5 border-b border-slate-100">
										<div className="flex justify-between">
											<span className="text-slate-500">Portfolio AUM:</span>
											<span className="font-bold text-slate-900">
												₹75,00,000
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-slate-500">Risk Profile:</span>
											<span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
												Moderately Aggressive
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-slate-500">Monthly Surplus:</span>
											<span className="font-bold text-emerald-700">
												₹1,50,000 / mo
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-slate-500">Active SIPs:</span>
											<span className="font-bold text-slate-700">
												₹60,000 / mo
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-slate-500">Unallocated Cash:</span>
											<span className="font-bold text-red-600">
												₹90,000 / mo
											</span>
										</div>
									</div>

									<div className="pt-2">
										<p className="text-[11px] font-bold text-slate-700 mb-1">
											Target Goals:
										</p>
										<p className="text-[11px] text-slate-600">
											• Children's Education: ₹50L (2032)
										</p>
										<p className="text-[11px] text-slate-600">
											• Early Retirement: ₹5 Cr (2042)
										</p>
									</div>
								</div>
							</>
						)}
					</div>
				</div>
			</div>
		</header>
	);
}
