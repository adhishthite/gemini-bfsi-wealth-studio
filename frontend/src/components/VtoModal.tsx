import { useState } from "react";
import {
	X,
	TrendingUp,
	Sparkles,
	ShieldCheck,
	Target,
	Layers,
	ArrowUpRight,
	FileText,
} from "lucide-react";
import { useStore } from "../store";
import { sendAction } from "../ws";

const SCENARIOS = [
	{
		id: "baseline",
		label: "Standard Baseline (12.8% CAGR)",
		desc: "Balanced market growth with moderate inflation",
	},
	{
		id: "bull_expansion",
		label: "Bull Supercycle (15.4% CAGR)",
		desc: "Rapid capex, earnings expansion, strong global inflows",
	},
	{
		id: "bear_recession",
		label: "Defensive / Recession (8.6% CAGR)",
		desc: "Market drawdown; gold & corporate debt stabilize returns",
	},
	{
		id: "rate_cut_cycle",
		label: "RBI Rate Cut Cycle (13.5% CAGR)",
		desc: "Bond capital appreciation + equity multiple expansion",
	},
	{
		id: "high_inflation",
		label: "High Inflation (11.2% CAGR)",
		desc: "Commodities & Sovereign Gold outperform",
	},
];

export default function VtoModal() {
	const { simulation, simulationOpen, set, pushToast } = useStore();

	const [activeScenario, setActiveScenario] = useState("baseline");
	const [eqPct, setEqPct] = useState(65);
	const [sipAmt, setSipAmt] = useState(100000);

	if (!simulationOpen) return null;

	const currentSim = simulation || {
		scenario: "baseline",
		target_allocation: { equity: 65, debt: 20, gold: 10, liquid: 5 },
		blended_expected_cagr_pct: 12.8,
		monthly_sip_inr: 100000,
		horizon_years: 15,
		projected_final_corpus_inr: 58200000,
		goals_feasibility: {
			education_2032_status: "Fully Funded (108% probability)",
			retirement_2042_status: "Achieved (₹5.82 Cr vs ₹5.0 Cr Target)",
		},
		trajectory: [
			{ year: 2026, projected_corpus_inr: 7500000 },
			{ year: 2028, projected_corpus_inr: 12400000 },
			{ year: 2030, projected_corpus_inr: 19800000 },
			{
				year: 2032,
				projected_corpus_inr: 31200000,
				education_goal_target: 5000000,
			},
			{ year: 2035, projected_corpus_inr: 39500000 },
			{ year: 2038, projected_corpus_inr: 47200000 },
			{
				year: 2042,
				projected_corpus_inr: 58200000,
				retirement_goal_target: 50000000,
			},
		],
	};

	const finalCrores = (
		(currentSim.projected_final_corpus_inr || 58200000) / 10000000
	).toFixed(2);

	const handleScenarioChange = (scId: string) => {
		setActiveScenario(scId);
		sendAction("simulate_portfolio", {
			market_scenario: scId,
			equity_pct: eqPct,
			debt_pct: Math.max(0, 95 - eqPct - 10),
			gold_pct: 10,
			liquid_pct: 5,
			monthly_sip_inr: sipAmt,
		});
	};

	const handleRecalculate = () => {
		sendAction("simulate_portfolio", {
			market_scenario: activeScenario,
			equity_pct: eqPct,
			debt_pct: Math.max(0, 95 - eqPct - 10),
			gold_pct: 10,
			liquid_pct: 5,
			monthly_sip_inr: sipAmt,
		});
		pushToast("Simulation recalculated with updated parameters", "info");
	};

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
			<div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
				{/* Modal Header */}
				<div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-[#0B2545] text-white flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="h-10 w-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
							<TrendingUp size={20} />
						</div>
						<div>
							<h2 className="text-base font-bold">
								Strategic Portfolio Simulation & Goal Projections
							</h2>
							<p className="text-xs text-slate-300">
								Monte Carlo multi-decade compounding forecast for Rahul Sharma
							</p>
						</div>
					</div>
					<button
						onClick={() => set({ simulationOpen: false })}
						className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
					>
						<X size={16} />
					</button>
				</div>

				{/* Modal Body */}
				<div className="p-6 overflow-y-auto space-y-6 flex-1">
					{/* Key Metric Highlights */}
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
							<p className="text-xs text-slate-500 font-semibold">
								2042 Retirement Corpus
							</p>
							<p className="text-2xl font-black text-emerald-600 mt-1">
								₹{finalCrores} Cr
							</p>
							<p className="text-[11px] text-emerald-700 font-medium mt-1">
								Target ₹5.00 Cr (116% Probability)
							</p>
						</div>

						<div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
							<p className="text-xs text-slate-500 font-semibold">
								Blended Expected CAGR
							</p>
							<p className="text-2xl font-black text-blue-600 mt-1">
								{currentSim.blended_expected_cagr_pct}% p.a.
							</p>
							<p className="text-[11px] text-slate-500 mt-1 font-medium">
								Weighted across 4 asset classes
							</p>
						</div>

						<div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
							<p className="text-xs text-slate-500 font-semibold">
								2032 Higher Education
							</p>
							<p className="text-2xl font-black text-slate-800 mt-1">₹54.2 L</p>
							<p className="text-[11px] text-emerald-700 font-medium mt-1">
								Target ₹50.0 L (Fully Funded)
							</p>
						</div>
					</div>

					{/* Scenario Selector */}
					<div className="space-y-2">
						<label className="text-xs font-bold text-slate-700 block">
							Macroeconomic Market Scenario:
						</label>
						<div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2">
							{SCENARIOS.map((sc) => {
								const active = activeScenario === sc.id;
								return (
									<button
										key={sc.id}
										onClick={() => handleScenarioChange(sc.id)}
										className={`p-2.5 rounded-xl border text-left transition ${
											active
												? "bg-[#0B2545] text-white border-[#0B2545] shadow-sm"
												: "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
										}`}
									>
										<p className="text-[11px] font-bold leading-tight">
											{sc.label}
										</p>
									</button>
								);
							})}
						</div>
					</div>

					{/* Interactive Allocation & SIP Controls */}
					<div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
						<h4 className="text-xs font-bold text-slate-800">
							Target Allocation & Surplus Deployment
						</h4>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div>
								<div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
									<span>Equity Allocation:</span>
									<span className="font-bold text-indigo-700">{eqPct}%</span>
								</div>
								<input
									type="range"
									min={40}
									max={80}
									step={5}
									value={eqPct}
									onChange={(e) => setEqPct(Number(e.target.value))}
									onMouseUp={handleRecalculate}
									className="w-full accent-indigo-600"
								/>
								<p className="text-[10px] text-slate-400 mt-1">
									Debt: {Math.max(0, 95 - eqPct - 10)}% | Gold: 10% | Cash: 5%
								</p>
							</div>

							<div>
								<div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
									<span>Total Monthly SIP:</span>
									<span className="font-bold text-emerald-700">
										₹{sipAmt.toLocaleString()} / mo
									</span>
								</div>
								<input
									type="range"
									min={50000}
									max={150000}
									step={10000}
									value={sipAmt}
									onChange={(e) => setSipAmt(Number(e.target.value))}
									onMouseUp={handleRecalculate}
									className="w-full accent-emerald-600"
								/>
								<p className="text-[10px] text-slate-400 mt-1">
									Deploying ₹90k unallocated surplus + existing ₹60k base
								</p>
							</div>
						</div>
					</div>

					{/* Visual Milestone Trajectory (SVG Chart) */}
					<div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-2">
						<div className="flex items-center justify-between">
							<h4 className="text-xs font-bold text-slate-800">
								15-Year Compounding Growth Cone
							</h4>
							<span className="text-[10px] font-semibold text-slate-500">
								Values in ₹ Lakhs & Crores
							</span>
						</div>

						{/* Custom lightweight SVG Trajectory Graph */}
						<div className="h-44 w-full relative pt-4">
							<svg
								viewBox="0 0 600 140"
								className="w-full h-full overflow-visible"
							>
								{/* Grid lines */}
								<line
									x1="0"
									y1="120"
									x2="600"
									y2="120"
									stroke="#E2E8F0"
									strokeWidth="1"
								/>
								<line
									x1="0"
									y1="80"
									x2="600"
									y2="80"
									stroke="#E2E8F0"
									strokeWidth="1"
									strokeDasharray="3 3"
								/>
								<line
									x1="0"
									y1="40"
									x2="600"
									y2="40"
									stroke="#E2E8F0"
									strokeWidth="1"
									strokeDasharray="3 3"
								/>

								{/* Target Milestones */}
								{/* 2032 Education */}
								<circle cx="280" cy="78" r="5" fill="#B8860B" />
								<text
									x="280"
									y="65"
									textAnchor="middle"
									fill="#B8860B"
									fontSize="9"
									fontWeight="bold"
								>
									2032: ₹50L Edu
								</text>

								{/* 2042 Retirement */}
								<circle cx="580" cy="22" r="6" fill="#059669" />
								<text
									x="580"
									y="12"
									textAnchor="end"
									fill="#059669"
									fontSize="10"
									fontWeight="bold"
								>
									2042: ₹5.82 Cr Retirement
								</text>

								{/* Trajectory Path */}
								<path
									d="M 20,112 Q 150,105 280,72 T 580,22"
									fill="none"
									stroke="#134074"
									strokeWidth="3.5"
								/>

								{/* Milestone X Labels */}
								<text x="20" y="135" fontSize="9" fill="#64748B">
									2026 (₹75L)
								</text>
								<text x="150" y="135" fontSize="9" fill="#64748B">
									2029
								</text>
								<text x="280" y="135" fontSize="9" fill="#64748B">
									2032 (₹1.8 Cr)
								</text>
								<text x="430" y="135" fontSize="9" fill="#64748B">
									2037 (₹3.6 Cr)
								</text>
								<text
									x="580"
									y="135"
									fontSize="9"
									fill="#64748B"
									textAnchor="end"
								>
									2042 (₹5.82 Cr)
								</text>
							</svg>
						</div>
					</div>
				</div>

				{/* Modal Footer */}
				<div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
					<p className="text-[11px] text-slate-500 font-medium">
						Projections are modeled estimates based on asset class historical
						returns.
					</p>
					<div className="flex items-center gap-2">
						<button
							onClick={() => {
								sendAction("generate_advisory_proposal", {
									strategic_rationale:
										"Optimized allocation with 65% Equity, 20% Debt, 10% Gold, 5% Liquid achieving ₹5.82 Cr corpus by 2042.",
								});
								set({ simulationOpen: false });
								pushToast("Generating Advisory Proposal PDF...", "info");
							}}
							className="px-4 py-2 rounded-xl bg-[#0B2545] hover:bg-[#134074] text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
						>
							<FileText size={14} className="text-amber-300" />
							<span>Generate Proposal PDF</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
