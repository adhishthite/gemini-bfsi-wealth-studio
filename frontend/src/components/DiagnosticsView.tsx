import { ShieldAlert, AlertTriangle, TrendingUp, PieChart, ArrowRight, CheckCircle, Clock } from "lucide-react";
import { useStore } from "@/store";
import { sendAction } from "@/ws";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function DiagnosticsView() {
	const { diagnostics, set } = useStore();

	const activeDiag = diagnostics || {
		client_name: "Rahul Sharma",
		total_aum_inr: 7500000,
		current_allocation: {
			equity: 0.7,
			debt: 0.15,
			gold: 0.1,
			cash_liquid: 0.05,
		},
		concentration_risks: [
			"Heavy concentration risk in Large Cap Equity (80% of equity book in a single fund).",
			"Under-allocated in Mid/Small Cap growth (0%) and Global Tech diversification (0%).",
			"Monthly SIP capacity of ₹1.5L has ₹90k unallocated idle cash surplus in savings account.",
		],
		goals: [
			{
				id: "GOAL-01",
				name: "Children's Higher Education",
				target_year: 2032,
				target_amount_inr: 5000000,
				current_funded_inr: 2200000,
				on_track: true,
			},
			{
				id: "GOAL-02",
				name: "Early Financial Independence (Retire @ 54)",
				target_year: 2042,
				target_amount_inr: 50000000,
				current_funded_inr: 5300000,
				on_track: "needs_sip_boost",
			},
		],
		monthly_surplus_inr: 150000,
		unallocated_surplus_inr: 90000,
	};

	return (
		<div className="space-y-5 pb-6">
			{/* Executive Summary Card */}
			<div className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-card-luxury relative overflow-hidden">
				<div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/10 via-amber-400/5 to-transparent rounded-full blur-3xl pointer-events-none" />

				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
					<div className="flex items-center gap-3.5">
						<div className="size-12 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
							<ShieldAlert className="size-6" />
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h2 className="text-base font-extrabold text-slate-900 dark:text-white">
									Portfolio Health & Diagnostic Audit
								</h2>
								<span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-400/15 border border-amber-400/30 text-amber-800 dark:text-amber-300">
									3 Actionable Skews
								</span>
							</div>
							<p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
								Comprehensive risk audit & asset allocation analysis for Rahul Sharma (₹75 Lakh AUM)
							</p>
						</div>
					</div>

					<Button
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
						className="bg-amber-400 text-slate-950 hover:bg-amber-300 font-bold text-xs h-10 px-4 rounded-xl gap-2 shadow-xs shrink-0"
					>
						<span>Launch Goal Simulation</span>
						<ArrowRight className="size-4" />
					</Button>
				</div>
			</div>

			{/* Middle Grid: Asset Allocation Drift & Concentration Risks */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
				{/* Asset Allocation Breakdown (7 cols) */}
				<div className="lg:col-span-7 glass-panel rounded-2xl p-5 space-y-4 shadow-sm dark:shadow-card-luxury border border-slate-200 dark:border-white/10">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<PieChart className="size-4 text-amber-500 dark:text-amber-400" />
							<h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
								Asset Allocation Drift vs Strategic Target
							</h3>
						</div>
						<span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Total ₹75,00,000</span>
					</div>

					{/* Asset Allocation Cards */}
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
						{/* Equity */}
						<div className="p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/30 text-center space-y-1">
							<p className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
								Equity
							</p>
							<p className="text-lg font-black font-mono text-slate-900 dark:text-white">70%</p>
							<p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">₹52.5 L</p>
							<div className="text-[9px] font-bold text-amber-800 dark:text-amber-400 bg-amber-400/10 py-0.5 rounded border border-amber-400/20">
								Target: 65% (-5%)
							</div>
						</div>

						{/* Debt */}
						<div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-center space-y-1">
							<p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
								Debt
							</p>
							<p className="text-lg font-black font-mono text-slate-900 dark:text-white">15%</p>
							<p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">₹11.25 L</p>
							<div className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-400/10 py-0.5 rounded border border-emerald-400/20">
								Target: 20% (+5%)
							</div>
						</div>

						{/* Gold */}
						<div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 text-center space-y-1">
							<p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
								Gold
							</p>
							<p className="text-lg font-black font-mono text-slate-900 dark:text-white">10%</p>
							<p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">₹7.5 L</p>
							<div className="text-[9px] font-bold text-slate-700 dark:text-slate-300 bg-slate-200/60 dark:bg-slate-800/60 py-0.5 rounded border border-slate-300 dark:border-white/5">
								Target: 10% (Optimal)
							</div>
						</div>

						{/* Liquid */}
						<div className="p-3 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-center space-y-1">
							<p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
								Liquid
							</p>
							<p className="text-lg font-black font-mono text-slate-900 dark:text-white">5%</p>
							<p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">₹3.75 L</p>
							<div className="text-[9px] font-bold text-slate-700 dark:text-slate-300 bg-slate-200/60 dark:bg-slate-800/60 py-0.5 rounded border border-slate-300 dark:border-white/5">
								Target: 5% (Optimal)
							</div>
						</div>
					</div>

					{/* Allocation Progress Bar comparison */}
					<div className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/5">
						<div className="flex justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
							<span>Current Allocation Spread</span>
							<span className="font-mono">70% Eq • 15% Debt • 10% Gold • 5% Cash</span>
						</div>
						<div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-white/10">
							<div style={{ width: "70%" }} className="bg-indigo-500 h-full" title="Equity: 70%" />
							<div style={{ width: "15%" }} className="bg-emerald-500 h-full" title="Debt: 15%" />
							<div style={{ width: "10%" }} className="bg-amber-400 h-full" title="Gold: 10%" />
							<div style={{ width: "5%" }} className="bg-slate-400 h-full" title="Liquid: 5%" />
						</div>
					</div>
				</div>

				{/* Concentration Risk Alerts (5 cols) */}
				<div className="lg:col-span-5 glass-panel rounded-2xl p-5 space-y-3 shadow-sm dark:shadow-card-luxury border border-slate-200 dark:border-white/10">
					<div className="flex items-center gap-2">
						<AlertTriangle className="size-4 text-amber-500 dark:text-amber-400" />
						<h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
							Concentration Risk Audit Findings
						</h3>
					</div>

					<div className="space-y-2.5">
						{activeDiag.concentration_risks.map((risk, i) => (
							<div
								key={i}
								className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-500/30 text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed flex items-start gap-2.5"
							>
								<span className="grid place-items-center size-5 rounded-full bg-amber-400/20 text-amber-800 dark:text-amber-300 font-mono text-[10px] font-black shrink-0 mt-0.5">
									{i + 1}
								</span>
								<span>{risk}</span>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Bottom Grid: Goal Milestones & Cash Surplus Audit */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
				{/* Goal Milestones (8 cols) */}
				<div className="lg:col-span-8 glass-panel rounded-2xl p-5 space-y-4 shadow-sm dark:shadow-card-luxury border border-slate-200 dark:border-white/10">
					<div className="flex items-center gap-2">
						<TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
						<h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
							Target Financial Goals & Funding Milestones
						</h3>
					</div>

					<div className="space-y-3">
						{activeDiag.goals.map((g) => {
							const pct = Math.min(
								100,
								Math.round((g.current_funded_inr / g.target_amount_inr) * 100),
							);
							const isOnTrack = g.on_track === true;

							return (
								<div
									key={g.id}
									className="p-4 rounded-xl bg-slate-50/90 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 space-y-2.5"
								>
									<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
										<div className="flex items-center gap-2">
											<span className="font-bold text-slate-900 dark:text-white text-xs">
												{g.name}
											</span>
											<span className="px-2 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/10">
												Target Year: {g.target_year}
											</span>
										</div>
										<div className="flex items-center gap-2">
											<span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
												₹{(g.current_funded_inr / 100000).toFixed(1)}L / ₹
												{(g.target_amount_inr / 100000).toFixed(0)}L
											</span>
											<span className="text-xs font-mono font-black text-amber-600 dark:text-amber-400">
												({pct}%)
											</span>
										</div>
									</div>

									<Progress
										value={pct}
										className="h-2 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-white/5"
									/>

									<div className="flex items-center justify-between text-[11px]">
										<span className="text-slate-500 dark:text-slate-400">
											{isOnTrack
												? "On track with current asset allocation"
												: "Requires ₹40k/mo SIP boost to achieve full corpus"}
										</span>
										<span
											className={`font-bold ${
												isOnTrack ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
											}`}
										>
											{isOnTrack ? "Fully Funded" : "SIP Boost Recommended"}
										</span>
									</div>
								</div>
							);
						})}
					</div>
				</div>

				{/* Cashflow & Surplus Audit (4 cols) */}
				<div className="lg:col-span-4 glass-panel rounded-2xl p-5 space-y-4 shadow-sm dark:shadow-card-luxury border border-slate-200 dark:border-white/10 flex flex-col justify-between">
					<div>
						<div className="flex items-center gap-2 mb-3">
							<Clock className="size-4 text-amber-500 dark:text-amber-400" />
							<h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
								Monthly Cashflow Surplus
							</h3>
						</div>

						<div className="space-y-3">
							<div className="p-3 rounded-xl bg-slate-50/90 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10">
								<p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">
									Total Monthly Surplus
								</p>
								<p className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
									₹1,50,000 / mo
								</p>
							</div>

							<div className="p-3 rounded-xl bg-slate-50/90 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10">
								<p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">
									Active SIP Commitments
								</p>
								<p className="text-lg font-black font-mono text-slate-800 dark:text-slate-200 mt-0.5">
									₹60,000 / mo
								</p>
							</div>

							<div className="p-3 rounded-xl bg-rose-50/90 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30">
								<p className="text-[10px] text-rose-700 dark:text-rose-300 uppercase font-bold">
									Idle Unallocated Cash
								</p>
								<p className="text-xl font-black font-mono text-rose-600 dark:text-rose-400 mt-0.5">
									₹90,000 / mo
								</p>
								<p className="text-[10px] text-rose-700/80 dark:text-rose-300/80 mt-1">
									Losing purchasing power to inflation in savings account.
								</p>
							</div>
						</div>
					</div>

					<Button
						onClick={() => {
							set({ activeTab: "explorer" });
						}}
						variant="outline"
						className="w-full h-9 rounded-xl border-amber-500/40 text-amber-800 dark:text-amber-300 hover:bg-amber-400/10 text-xs font-bold mt-2"
					>
						Deploy Surplus in Product Explorer
					</Button>
				</div>
			</div>
		</div>
	);
}
