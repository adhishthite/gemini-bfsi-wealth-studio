import { useState } from "react";
import { useStore } from "@/store";
import { sendAction } from "@/ws";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { inr, inrCompact, inrParts, pct } from "@/lib";
import type { SimulationData } from "@/types";

/* ---------------------------------------------------------------------------
   The fifteen-year projection, set as a working note rather than a control
   panel. The projected corpus is the hero numeral; the scenario tiles carry
   state by rule weight, and the one selected scenario is the single accent
   on this surface. The trajectory is drawn from the returned data, in ink.
   ------------------------------------------------------------------------ */

const SCENARIOS = [
	{
		id: "baseline",
		label: "Baseline",
		cagr: "12.8%",
		desc: "Balanced growth, moderate inflation",
	},
	{
		id: "bull_expansion",
		label: "Bull supercycle",
		cagr: "15.4%",
		desc: "Capex and earnings expansion, strong inflows",
	},
	{
		id: "bear_recession",
		label: "Recession",
		cagr: "8.6%",
		desc: "Drawdown; gold and corporate debt hold the line",
	},
	{
		id: "rate_cut_cycle",
		label: "RBI rate cuts",
		cagr: "13.5%",
		desc: "Bond appreciation with equity re-rating",
	},
	{
		id: "high_inflation",
		label: "High inflation",
		cagr: "11.2%",
		desc: "Commodities and sovereign gold outperform",
	},
];

const CHART_W = 600;
const CHART_H = 150;
const PAD_X = 24;
const PAD_TOP = 22;
const PAD_BOTTOM = 34;

export default function SimulationDialog() {
	const { simulation, simulationOpen, set, pushToast } = useStore();

	const [activeScenario, setActiveScenario] = useState("baseline");
	const [eqPct, setEqPct] = useState(65);
	const [sipAmt, setSipAmt] = useState(100000);

	const currentSim: SimulationData = simulation || {
		scenario: "baseline",
		target_allocation: { equity: 65, debt: 20, gold: 10, liquid: 5 },
		blended_expected_cagr_pct: 12.8,
		monthly_sip_inr: 100000,
		horizon_years: 15,
		projected_final_corpus_inr: 58200000,
		goals_feasibility: {
			education_2032_status: "Fully funded, 108% of target",
			retirement_2042_status: "Met — ₹5.82 Cr against a ₹5.0 Cr target",
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

	const corpus = inrParts(currentSim.projected_final_corpus_inr || 58200000);
	const horizonEnd =
		currentSim.trajectory?.[currentSim.trajectory.length - 1]?.year ?? 2042;

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
		pushToast("Recalculating the projection", "info");
	};

	/* The trajectory, plotted from the returned series. */
	const points = currentSim.trajectory ?? [];
	const years = points.map((p) => p.year);
	const values = points.map((p) => p.projected_corpus_inr);
	const minYear = years.length ? Math.min(...years) : 2026;
	const maxYear = years.length ? Math.max(...years) : horizonEnd;
	const maxValue = values.length ? Math.max(...values) : 1;
	const plotX = (year: number) =>
		PAD_X +
		((year - minYear) / Math.max(1, maxYear - minYear)) * (CHART_W - PAD_X * 2);
	const plotY = (value: number) =>
		PAD_TOP +
		(1 - value / Math.max(1, maxValue)) * (CHART_H - PAD_TOP - PAD_BOTTOM);
	const line = points
		.map((p, i) => `${i === 0 ? "M" : "L"} ${plotX(p.year)},${plotY(p.projected_corpus_inr)}`)
		.join(" ");

	return (
		<Dialog
			open={simulationOpen}
			onOpenChange={(open) => set({ simulationOpen: open })}
		>
			<DialogContent className="flex max-h-[90vh] max-w-4xl flex-col gap-0 overflow-hidden rounded-lg border border-rule bg-paper-sheet p-0 text-ink shadow-raise">
				<DialogHeader className="doc-rule space-y-0 px-gutter pb-5 pt-6 text-left">
					<p className="label">Goal projection</p>
					<DialogTitle className="doc-title mt-2 text-xl font-normal">
						Fifteen-year rebalancing simulation
					</DialogTitle>
					<DialogDescription className="mt-2 text-xs text-ink-muted">
						Modelled to {horizonEnd} on the target allocation and the monthly
						commitment below
					</DialogDescription>
				</DialogHeader>

				<div className="flex-1 space-y-rhythm overflow-y-auto px-gutter pb-6">
					{/* The projected corpus, and the two facts that qualify it */}
					<div className="grid grid-cols-1 gap-6 border-t border-rule pt-5 sm:grid-cols-3">
						<div>
							<p className="label">Projected corpus, {horizonEnd}</p>
							<div className="mt-2 flex items-end gap-2">
								<p className="figure-lg tabular-nums">{corpus.value}</p>
								<span className="figure-unit pb-1.5">{corpus.unit}</span>
							</div>
						</div>
						<div>
							<p className="label">Blended expected return</p>
							<div className="mt-2 flex items-end gap-2">
								<p className="figure tabular-nums">
									{pct(currentSim.blended_expected_cagr_pct)}
								</p>
								<span className="figure-unit pb-1">p.a.</span>
							</div>
						</div>
						<div>
							<p className="label">Monthly commitment</p>
							<p className="figure mt-2 tabular-nums">
								{inr(currentSim.monthly_sip_inr)}
							</p>
						</div>
					</div>

					{/* Goal feasibility, as ruled statements */}
					<div className="divide-y divide-rule border-y border-rule">
						<div className="flex items-baseline justify-between gap-4 py-3.5">
							<p className="text-sm text-ink-strong">
								Children's higher education, 2032
							</p>
							<p className="text-xs text-ink-muted">
								{currentSim.goals_feasibility?.education_2032_status}
							</p>
						</div>
						<div className="flex items-baseline justify-between gap-4 py-3.5">
							<p className="text-sm text-ink-strong">
								Financial independence, 2042
							</p>
							<p className="text-xs text-ink-muted">
								{currentSim.goals_feasibility?.retirement_2042_status}
							</p>
						</div>
					</div>

					{/* Scenario — the selected tile is the one accent on this screen */}
					<div>
						<p className="label-strong border-b border-rule-strong pb-2">
							Market scenario
						</p>
						<div className="grid grid-cols-1 gap-2 pt-4 sm:grid-cols-3 lg:grid-cols-5">
							{SCENARIOS.map((sc) => {
								const active = activeScenario === sc.id;
								return (
									<button
										key={sc.id}
										type="button"
										onClick={() => handleScenarioChange(sc.id)}
										className={`${
											active ? "paper-marked" : "paper-interactive"
										} px-3.5 py-3 text-left`}
									>
										<p className="text-sm font-medium text-ink-strong">
											{sc.label}
										</p>
										<p className="mt-1 text-xs tabular-nums text-ink-muted">
											{sc.cagr} p.a.
										</p>
										<p className="mt-1.5 text-xs leading-snug text-ink-faint">
											{sc.desc}
										</p>
									</button>
								);
							})}
						</div>
					</div>

					{/* Allocation and surplus deployment */}
					<div className="paper-sunken px-5 py-5">
						<p className="label-strong">Target allocation and deployment</p>
						<div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
							<div>
								<div className="flex items-baseline justify-between">
									<span className="label">Equity</span>
									<span className="figure-sm tabular-nums">{eqPct}%</span>
								</div>
								<Slider
									min={40}
									max={80}
									step={5}
									value={[eqPct]}
									onValueChange={(val) => setEqPct(val[0])}
									onValueCommit={(val) => handleRecalculate(val[0], sipAmt)}
									className="py-3"
								/>
								<p className="text-xs tabular-nums text-ink-muted">
									Debt {Math.max(0, 95 - eqPct - 10)}% · Gold 10% · Cash 5%
								</p>
							</div>

							<div>
								<div className="flex items-baseline justify-between">
									<span className="label">Monthly SIP</span>
									<span className="figure-sm tabular-nums">{inr(sipAmt)}</span>
								</div>
								<Slider
									min={50000}
									max={150000}
									step={10000}
									value={[sipAmt]}
									onValueChange={(val) => setSipAmt(val[0])}
									onValueCommit={(val) => handleRecalculate(eqPct, val[0])}
									className="py-3"
								/>
								<p className="text-xs text-ink-muted">
									Deploys the idle {inr(90000)} surplus on top of the existing{" "}
									{inr(60000)} base
								</p>
							</div>
						</div>
					</div>

					{/* Trajectory */}
					<div>
						<div className="flex items-baseline justify-between border-b border-rule-strong pb-2">
							<p className="label-strong">Compounding trajectory</p>
							<p className="label">{minYear} to {maxYear}</p>
						</div>
						<div className="relative h-48 w-full pt-5">
							<svg
								viewBox={`0 0 ${CHART_W} ${CHART_H}`}
								className="h-full w-full overflow-visible"
							>
								{[0.25, 0.5, 0.75, 1].map((f) => (
									<line
										key={f}
										x1={PAD_X}
										x2={CHART_W - PAD_X}
										y1={plotY(maxValue * f)}
										y2={plotY(maxValue * f)}
										stroke="currentColor"
										className="text-rule"
										strokeWidth="1"
									/>
								))}

								<path
									d={line}
									fill="none"
									stroke="currentColor"
									className="text-ink-strong"
									strokeWidth="2.5"
									strokeLinejoin="round"
									strokeLinecap="round"
								/>

								{points.map((p) => {
									const milestone =
										p.education_goal_target || p.retirement_goal_target;
									return (
										<g key={p.year}>
											<circle
												cx={plotX(p.year)}
												cy={plotY(p.projected_corpus_inr)}
												r={milestone ? 5 : 3}
												fill="currentColor"
												className="text-ink-strong"
											/>
											{milestone ? (
												<text
													x={plotX(p.year)}
													y={plotY(p.projected_corpus_inr) - 13}
													textAnchor={p.year === maxYear ? "end" : "middle"}
													fontSize="13"
													fontWeight="500"
													fill="currentColor"
													className="text-ink-strong"
												>
													{inrCompact(p.projected_corpus_inr)}
												</text>
											) : null}
										</g>
									);
								})}

								{points.map((p, i) =>
									i % 2 === 0 || p.year === maxYear ? (
										<text
											key={`x-${p.year}`}
											x={plotX(p.year)}
											y={CHART_H - 8}
											textAnchor={
												p.year === maxYear
													? "end"
													: p.year === minYear
														? "start"
														: "middle"
											}
											fontSize="12"
											fill="currentColor"
											className="text-ink-faint"
										>
											{p.year}
										</text>
									) : null,
								)}
							</svg>
						</div>
					</div>
				</div>

				{/* Foot of the note */}
				<div className="flex items-center justify-between gap-4 border-t border-rule-strong px-gutter py-4">
					<p className="text-xs text-ink-muted">
						Projections are modelled estimates based on asset class history, not
						a guarantee of return.
					</p>
					<div className="flex shrink-0 items-center gap-2.5">
						<Button
							variant="outline"
							onClick={() => set({ simulationOpen: false })}
							className="h-10 rounded-lg text-sm font-semibold"
						>
							Close
						</Button>
						<Button
							variant="wealth"
							onClick={() => {
								sendAction("generate_advisory_proposal", {
									strategic_rationale: `Target allocation of ${eqPct}% equity, ${Math.max(
										0,
										95 - eqPct - 10,
									)}% debt, 10% gold and 5% liquid, projected to reach ${inrCompact(
										currentSim.projected_final_corpus_inr,
									)} by ${horizonEnd}.`,
								});
								set({ simulationOpen: false });
								pushToast("Generating the advisory proposal", "info");
							}}
							className="h-10 rounded-lg text-sm font-semibold"
						>
							Generate advisory proposal
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
