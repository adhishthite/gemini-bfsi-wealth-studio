import { useState } from "react";
import { TrendingUp, FileText, Sparkles, CheckCircle2, Sliders, DollarSign } from "lucide-react";
import { useStore } from "@/store";
import { sendAction } from "@/ws";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

const SCENARIOS = [
	{
		id: "baseline",
		label: "Standard Baseline (12.8% CAGR)",
		desc: "Balanced long-term compounding across asset classes",
		badge: "Standard",
	},
	{
		id: "bull_expansion",
		label: "Bull Supercycle (15.4% CAGR)",
		desc: "Strong earnings expansion, Capex, and foreign inflows",
		badge: "Optimistic",
	},
	{
		id: "bear_recession",
		label: "Defensive / Recession (8.6% CAGR)",
		desc: "Drawdown buffer; Sovereign Gold & Gilts cushion portfolio",
		badge: "Conservative",
	},
	{
		id: "rate_cut_cycle",
		label: "RBI Rate Cut Cycle (13.5% CAGR)",
		desc: "Bond capital appreciation + equity PE multiple expansion",
		badge: "Monetary Easing",
	},
	{
		id: "high_inflation",
		label: "High Inflation (11.2% CAGR)",
		desc: "Commodities & Sovereign Gold outperform debt",
		badge: "Inflation Hedge",
	},
];

export default function SimulationView() {
	const { simulation, set, pushToast } = useStore();

	const [activeScenario, setActiveScenario] = useState("baseline");
	const [eqPct, setEqPct] = useState(65);
	const [sipAmt, setSipAmt] = useState(100000);

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

	const handleRecalculate = (equity: number, sip: number) => {
		sendAction("simulate_portfolio", {
			market_scenario: activeScenario,
			equity_pct: equity,
			debt_pct: Math.max(0, 95 - equity - 10),
			gold_pct: 10,
			liquid_pct: 5,
			monthly_sip_inr: sip,
		});
		pushToast("Simulation recalculated with updated parameters", "info");
	};

	const handleGenerateProposal = () => {
		sendAction("generate_advisory_proposal", {
			strategic_rationale: `Strategic rebalancing to ${eqPct}% Equity, ${Math.max(
				0,
				95 - eqPct - 10,
			)}% Debt, 10% Gold, 5% Liquid with ₹${(sipAmt / 1000).toFixed(
				0,
			)}k/mo SIP, projecting ₹${finalCrores} Cr corpus for 2042 Early Retirement.`,
		});
		pushToast("Generating Official Wealth Advisory Proposal PDF...", "info");
	};

	return (
		<div className="space-y-5 pb-6">
			{/* Top Metric Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				{/* 2042 Retirement Corpus */}
				<div className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-card-luxury relative overflow-hidden">
					<div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
					<p className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
						2042 Early Retirement Corpus
					</p>
					<p className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
						₹{finalCrores} Cr
					</p>
					<div className="flex items-center gap-1.5 mt-1.5 text-xs text-emerald-700 dark:text-emerald-300">
						<CheckCircle2 className="size-3.5" />
						<span className="font-semibold">Target ₹5.00 Cr (116% Probability)</span>
					</div>
				</div>

				{/* Blended Expected CAGR */}
				<div className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-card-luxury relative overflow-hidden">
					<div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
					<p className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
						Blended Expected Return
					</p>
					<p className="text-3xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1">
						{currentSim.blended_expected_cagr_pct}% p.a.
					</p>
					<p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
						Multi-asset strategic weighting
					</p>
				</div>

				{/* 2032 Higher Education */}
				<div className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-card-luxury relative overflow-hidden">
					<div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
					<p className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
						2032 Children Higher Education
					</p>
					<p className="text-3xl font-black font-mono text-slate-900 dark:text-white mt-1">₹54.2 L</p>
					<div className="flex items-center gap-1.5 mt-1.5 text-xs text-emerald-700 dark:text-emerald-300">
						<CheckCircle2 className="size-3.5" />
						<span className="font-semibold">Target ₹50.0 L (Fully Funded)</span>
					</div>
				</div>
			</div>

			{/* Compounding Growth Cone (SVG Chart Canvas) */}
			<div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-card-luxury space-y-3">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
					<div>
						<h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
							15-Year Compounding Growth Cone & Goal Milestones
						</h3>
						<p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
							Interactive trajectory from ₹75L baseline to ₹5.82 Cr 2042 milestone
						</p>
					</div>
					<span className="text-[11px] font-mono font-semibold text-amber-800 dark:text-amber-400 bg-amber-400/15 px-2.5 py-1 rounded-lg border border-amber-400/30">
						₹{sipAmt.toLocaleString()} / mo SIP Active
					</span>
				</div>

				{/* SVG Trajectory Chart */}
				<div className="h-56 w-full relative pt-4">
					<svg
						viewBox="0 0 700 160"
						className="w-full h-full overflow-visible"
					>
						{/* Horizontal grid lines */}
						<line
							x1="0"
							y1="140"
							x2="700"
							y2="140"
							stroke="rgba(150,150,150,0.25)"
							strokeWidth="1"
						/>
						<line
							x1="0"
							y1="95"
							x2="700"
							y2="95"
							stroke="rgba(150,150,150,0.2)"
							strokeWidth="1"
							strokeDasharray="3 3"
						/>
						<line
							x1="0"
							y1="45"
							x2="700"
							y2="45"
							stroke="rgba(150,150,150,0.2)"
							strokeWidth="1"
							strokeDasharray="3 3"
						/>

						{/* Shaded Area Under Trajectory */}
						<path
							d="M 25,130 Q 180,122 340,85 T 675,28 L 675,140 L 25,140 Z"
							fill="url(#goldGradient)"
							opacity="0.18"
						/>

						{/* Gradients */}
						<defs>
							<linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
								<stop offset="0%" stopColor="#1E293B" />
								<stop offset="50%" stopColor="#D97706" />
								<stop offset="100%" stopColor="#10B981" />
							</linearGradient>
							<linearGradient id="trajectoryStroke" x1="0%" y1="0%" x2="100%" y2="0%">
								<stop offset="0%" stopColor="#D97706" />
								<stop offset="50%" stopColor="#F59E0B" />
								<stop offset="100%" stopColor="#10B981" />
							</linearGradient>
						</defs>

						{/* Main Trajectory Stroke */}
						<path
							d="M 25,130 Q 180,122 340,85 T 675,28"
							fill="none"
							stroke="url(#trajectoryStroke)"
							strokeWidth="3.5"
						/>

						{/* Milestone Point 1: 2026 Baseline */}
						<circle cx="25" cy="130" r="5" fill="#D97706" />
						<text x="25" y="115" fontSize="10" fill="#D97706" fontWeight="bold">
							2026: ₹75L
						</text>

						{/* Milestone Point 2: 2032 Education */}
						<circle cx="340" cy="85" r="6" fill="#F59E0B" />
						<text x="340" y="70" textAnchor="middle" fontSize="10" fill="#F59E0B" fontWeight="bold">
							2032: ₹50L Education Goal
						</text>

						{/* Milestone Point 3: 2042 Early Retirement */}
						<circle cx="675" cy="28" r="7" fill="#10B981" />
						<text x="675" y="14" textAnchor="end" fontSize="11" fill="#10B981" fontWeight="black">
							2042: ₹5.82 Cr Retirement Milestone
						</text>

						{/* X-Axis Year Labels */}
						<text x="25" y="155" fontSize="10" fill="#64748B" fontFamily="monospace">
							2026
						</text>
						<text x="180" y="155" fontSize="10" fill="#64748B" fontFamily="monospace">
							2029 (₹1.2 Cr)
						</text>
						<text x="340" y="155" fontSize="10" fill="#64748B" fontFamily="monospace" textAnchor="middle">
							2032 (₹2.4 Cr)
						</text>
						<text x="510" y="155" fontSize="10" fill="#64748B" fontFamily="monospace">
							2037 (₹3.9 Cr)
						</text>
						<text x="675" y="155" fontSize="10" fill="#64748B" fontFamily="monospace" textAnchor="end">
							2042 (₹5.82 Cr)
						</text>
					</svg>
				</div>
			</div>

			{/* Interactive Parameter Controls & Macro Scenarios */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
				{/* Scenario Matrix (7 cols) */}
				<div className="lg:col-span-7 glass-panel rounded-2xl p-5 space-y-3 shadow-sm dark:shadow-card-luxury border border-slate-200 dark:border-white/10">
					<h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
						Macroeconomic Scenario Sensitivity
					</h3>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
						{SCENARIOS.map((sc) => {
							const active = activeScenario === sc.id;
							return (
								<button
									key={sc.id}
									type="button"
									onClick={() => handleScenarioChange(sc.id)}
									className={`p-3 rounded-xl border text-left transition-all ${
										active
											? "bg-amber-400/20 border-amber-400/70 text-slate-900 dark:text-white shadow-xs ring-1 ring-amber-400/50"
											: "bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-white/15"
									}`}
								>
									<div className="flex items-center justify-between">
										<p className="text-xs font-bold leading-tight">{sc.label}</p>
										<span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-900 text-amber-800 dark:text-amber-300 border border-slate-300 dark:border-white/10">
											{sc.badge}
										</span>
									</div>
									<p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
										{sc.desc}
									</p>
								</button>
							);
						})}
					</div>
				</div>

				{/* Allocation & SIP Sliders (5 cols) */}
				<div className="lg:col-span-5 glass-panel rounded-2xl p-5 space-y-4 shadow-sm dark:shadow-card-luxury border border-slate-200 dark:border-white/10 flex flex-col justify-between">
					<div className="space-y-4">
						<h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
							Simulation Levers & SIP Deployment
						</h3>

						{/* Equity Slider */}
						<div className="space-y-2">
							<div className="flex justify-between text-xs font-semibold">
								<span className="text-slate-500 dark:text-slate-400">Equity Target Weight:</span>
								<span className="font-mono font-bold text-amber-600 dark:text-amber-400">{eqPct}%</span>
							</div>
							<Slider
								min={40}
								max={80}
								step={5}
								value={[eqPct]}
								onValueChange={(val) => setEqPct(val[0])}
								onValueCommit={(val) => handleRecalculate(val[0], sipAmt)}
								className="py-1"
							/>
							<p className="text-[10px] text-slate-500 font-mono">
								Debt: {Math.max(0, 95 - eqPct - 10)}% | Gold: 10% | Cash: 5%
							</p>
						</div>

						{/* Monthly SIP Slider */}
						<div className="space-y-2">
							<div className="flex justify-between text-xs font-semibold">
								<span className="text-slate-500 dark:text-slate-400">Monthly SIP Deployment:</span>
								<span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
									₹{sipAmt.toLocaleString()} / mo
								</span>
							</div>
							<Slider
								min={50000}
								max={150000}
								step={10000}
								value={[sipAmt]}
								onValueChange={(val) => setSipAmt(val[0])}
								onValueCommit={(val) => handleRecalculate(eqPct, val[0])}
								className="py-1"
							/>
							<p className="text-[10px] text-slate-500 font-mono">
								Deploying ₹90k unallocated surplus + ₹60k base SIP
							</p>
						</div>
					</div>

					<Button
						onClick={handleGenerateProposal}
						className="w-full h-10 bg-amber-400 text-slate-950 hover:bg-amber-300 font-bold text-xs gap-2 rounded-xl mt-2 shadow-xs"
					>
						<FileText className="size-4 text-slate-950" />
						<span>Generate Advisory Proposal PDF</span>
					</Button>
				</div>
			</div>
		</div>
	);
}
