import {
	X,
	ShieldAlert,
	CheckCircle2,
	AlertTriangle,
	TrendingUp,
	PieChart,
} from "lucide-react";
import { useStore } from "../store";
import { sendAction } from "../ws";

export default function OrdersModal() {
	const { diagnosticsOpen, diagnostics, portfolio, set } = useStore();

	if (!diagnosticsOpen) return null;

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
		<div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
			<div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden">
				{/* Header */}
				<div className="p-5 border-b border-slate-100 bg-[#0B2545] text-white flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="h-9 w-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
							<ShieldAlert size={20} />
						</div>
						<div>
							<h3 className="text-sm font-bold">
								Portfolio Diagnostics & Health Check
							</h3>
							<p className="text-[11px] text-slate-300">
								Asset allocation skew & concentration risk audit for Rahul
								Sharma
							</p>
						</div>
					</div>
					<button
						onClick={() => set({ diagnosticsOpen: false })}
						className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
					>
						<X size={16} />
					</button>
				</div>

				{/* Content */}
				<div className="p-6 space-y-5 text-xs">
					{/* Concentration Alerts */}
					<div className="space-y-2">
						<h4 className="font-bold text-slate-800 flex items-center gap-1.5">
							<AlertTriangle size={14} className="text-amber-600" />
							<span>Diagnostic Findings & Asset Concentration Risks</span>
						</h4>
						<div className="space-y-1.5">
							{activeDiag.concentration_risks.map((risk, i) => (
								<div
									key={i}
									className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-950 flex items-start gap-2 leading-relaxed"
								>
									<span className="font-bold text-amber-700 mt-0.5">•</span>
									<span>{risk}</span>
								</div>
							))}
						</div>
					</div>

					{/* Current Asset Allocation Breakdown */}
					<div className="space-y-2">
						<h4 className="font-bold text-slate-800 flex items-center gap-1.5">
							<PieChart size={14} className="text-blue-600" />
							<span>Current Allocation Breakdown (₹75 Lakh Total AUM)</span>
						</h4>
						<div className="grid grid-cols-4 gap-2 text-center">
							<div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100">
								<p className="text-[10px] font-semibold text-indigo-700">
									Equity (70%)
								</p>
								<p className="font-extrabold text-indigo-950 mt-0.5">₹52.5 L</p>
							</div>
							<div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
								<p className="text-[10px] font-semibold text-emerald-700">
									Debt (15%)
								</p>
								<p className="font-extrabold text-emerald-950 mt-0.5">
									₹11.25 L
								</p>
							</div>
							<div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100">
								<p className="text-[10px] font-semibold text-amber-800">
									Gold (10%)
								</p>
								<p className="font-extrabold text-amber-950 mt-0.5">₹7.5 L</p>
							</div>
							<div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200">
								<p className="text-[10px] font-semibold text-slate-600">
									Liquid (5%)
								</p>
								<p className="font-extrabold text-slate-900 mt-0.5">₹3.75 L</p>
							</div>
						</div>
					</div>

					{/* Goal Milestones */}
					<div className="space-y-2">
						<h4 className="font-bold text-slate-800 flex items-center gap-1.5">
							<TrendingUp size={14} className="text-emerald-600" />
							<span>Goal Milestones & Funding Progress</span>
						</h4>
						<div className="space-y-2">
							{activeDiag.goals.map((g) => {
								const pct = Math.min(
									100,
									Math.round(
										(g.current_funded_inr / g.target_amount_inr) * 100,
									),
								);
								return (
									<div
										key={g.id}
										className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5"
									>
										<div className="flex justify-between font-semibold">
											<span className="text-slate-800 font-bold">
												{g.name} ({g.target_year})
											</span>
											<span className="text-slate-600">
												₹{(g.current_funded_inr / 100000).toFixed(1)}L / ₹
												{(g.target_amount_inr / 100000).toFixed(0)}L
											</span>
										</div>
										<div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
											<div
												className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full"
												style={{ width: `${pct}%` }}
											/>
										</div>
									</div>
								);
							})}
						</div>
					</div>

					{/* Action button */}
					<button
						onClick={() => {
							set({ diagnosticsOpen: false, simulationOpen: true });
							sendAction("simulate_portfolio", {
								equity_pct: 65,
								debt_pct: 20,
								gold_pct: 10,
								liquid_pct: 5,
								monthly_sip_inr: 100000,
							});
						}}
						className="w-full py-2.5 px-4 rounded-xl bg-[#0B2545] hover:bg-[#134074] text-white font-bold text-xs transition"
					>
						Launch Rebalancing & Goal Simulation
					</button>
				</div>
			</div>
		</div>
	);
}
