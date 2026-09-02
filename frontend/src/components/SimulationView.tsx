import { useState } from "react";
import { FileText } from "lucide-react";
import { useStore } from "@/store";
import { sendAction } from "@/ws";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { inrCompact, inrParts, pct, rupee } from "@/lib";

/* Scenario ids are wire values read by the backend simulator — the copy around
	 them is ours, the ids are not. */
const SCENARIOS = [
	{
		id: "baseline",
		name: "Standard baseline",
		cagr: 12.8,
		note: "Balanced compounding across the four sleeves",
	},
	{
		id: "bull_expansion",
		name: "Bull supercycle",
		cagr: 15.4,
		note: "Earnings expansion, capex and foreign inflows",
	},
	{
		id: "bear_recession",
		name: "Defensive recession",
		cagr: 8.6,
		note: "Sovereign gold and gilts cushion the drawdown",
	},
	{
		id: "rate_cut_cycle",
		name: "RBI rate cut cycle",
		cagr: 13.5,
		note: "Bond appreciation with equity multiple expansion",
	},
	{
		id: "high_inflation",
		name: "High inflation",
		cagr: 11.2,
		note: "Commodities and sovereign gold outrun debt",
	},
];

/* The same ink ramp the audit page uses, in the same order. Two charts, one
	 colour system. The accent is reserved for the projection line alone. */
const SLEEVES = [
	{ key: "equity", name: "Equity", ink: "var(--ink-strong)" },
	{ key: "debt", name: "Debt", ink: "var(--ink)" },
	{ key: "gold", name: "Gold", ink: "var(--ink-muted)" },
	{ key: "liquid", name: "Liquid", ink: "var(--ink-faint)" },
] as const;

/* Chart frame. One plot, drawn from the trajectory the simulator returns. */
const W = 720;
const H = 240;
const PAD_L = 14;
const PAD_R = 14;
const PAD_T = 44;
const PAD_B = 44;

export default function SimulationView() {
	const { simulation } = useStore();

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
			education_2032_status: "Fully funded, 108% of target",
			retirement_2042_status: "Met, \u20b95.82 Cr against a \u20b95.00 Cr target",
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

	const corpus = currentSim.projected_final_corpus_inr || 58200000;
	const finalCrores = (corpus / 10000000).toFixed(2);
	const hero = inrParts(corpus);

	const traj =
		currentSim.trajectory && currentSim.trajectory.length > 1
			? currentSim.trajectory
			: [
					{ year: 2026, projected_corpus_inr: 7500000 },
					{ year: 2042, projected_corpus_inr: corpus },
				];

	const mandateTarget =
		traj.find((p) => Boolean(p.retirement_goal_target))
			?.retirement_goal_target || 50000000;
	const surplus = corpus - mandateTarget;

	const firstYear = traj[0].year;
	const lastPoint = traj[traj.length - 1];
	const span = Math.max(1, lastPoint.year - firstYear);
	const peak =
		Math.max(...traj.map((p) => p.projected_corpus_inr), mandateTarget) * 1.1;

	const xOf = (year: number) =>
		PAD_L + ((year - firstYear) / span) * (W - PAD_L - PAD_R);
	const yOf = (value: number) =>
		H - PAD_B - (value / peak) * (H - PAD_T - PAD_B);

	const projectionPath = traj
		.map(
			(p, i) =>
				`${i === 0 ? "M" : "L"} ${xOf(p.year).toFixed(1)},${yOf(
					p.projected_corpus_inr,
				).toFixed(1)}`,
		)
		.join(" ");

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
	};

	const handleGenerateProposal = () => {
		sendAction("generate_advisory_proposal", {
			strategic_rationale: `Strategic rebalancing to ${eqPct}% Equity, ${Math.max(
				0,
				95 - eqPct - 10,
			)}% Debt, 10% Gold, 5% Liquid with \u20b9${(sipAmt / 1000).toFixed(
				0,
			)}k/mo SIP, projecting \u20b9${finalCrores} Cr corpus for 2042 Early Retirement.`,
		});
	};

	const activeName =
		SCENARIOS.find((s) => s.id === activeScenario)?.name || "Standard baseline";

	return (
		<div className="space-y-rhythm pb-10">
			{/* ---- The finding ------------------------------------------------ */}
			<section className="paper reveal reveal-1">
				<div className="doc-rule" />
				<div className="space-y-7 p-gutter">
					<div className="flex flex-wrap items-baseline justify-between gap-3">
						<p className="label-strong">Goal simulation</p>
						<p className="ref text-ink-muted">
							{activeName} &middot; {currentSim.horizon_years} years
						</p>
					</div>

					<div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
						<div className="space-y-4">
							<h2 className="doc-title text-xl">
								Projected corpus at {lastPoint.year}
							</h2>
							<div className="flex items-baseline gap-2">
								<span className="figure-xl">{hero.value}</span>
								<span className="figure-unit">{hero.unit}</span>
							</div>
							<p className="max-w-lg text-sm text-ink-muted">
								{surplus >= 0 ? "+" : "-"}
								{inrCompact(Math.abs(surplus))} against the{" "}
								{inrCompact(mandateTarget)} retirement mandate, on a monthly
								commitment of {rupee(sipAmt)}.
							</p>
						</div>

						<div className="flex gap-10 lg:pb-1">
							<div>
								<p className="label">Blended return</p>
								<div className="mt-1.5 flex items-baseline gap-1.5">
									<span className="figure">
										{pct(currentSim.blended_expected_cagr_pct)}
									</span>
									<span className="figure-unit">p.a.</span>
								</div>
							</div>
							<div>
								<p className="label">Monthly commitment</p>
								<p className="figure mt-1.5">{rupee(sipAmt)}</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ---- The projection --------------------------------------------- */}
			<section className="paper space-y-5 p-gutter reveal reveal-2">
				<div className="flex flex-wrap items-baseline justify-between gap-3">
					<h3 className="doc-title text-lg">
						Path to {lastPoint.year}
					</h3>
					<p className="ref text-ink-muted">
						{inrCompact(traj[0].projected_corpus_inr)} today &rarr;{" "}
						{inrCompact(lastPoint.projected_corpus_inr)}
					</p>
				</div>

				<svg
					viewBox={`0 0 ${W} ${H}`}
					className="h-[260px] w-full"
					role="img"
					aria-label={`Projected corpus rising to ${hero.value} ${hero.unit} by ${lastPoint.year}`}
				>
					{/* The retirement mandate: the only reference line on the plot. */}
					<line
						x1={PAD_L}
						y1={yOf(mandateTarget)}
						x2={W - PAD_R}
						y2={yOf(mandateTarget)}
						stroke="var(--rule-strong)"
						strokeWidth="1"
						strokeDasharray="4 4"
					/>
					<text
						x={PAD_L}
						y={yOf(mandateTarget) - 8}
						fontSize="14"
						fill="var(--ink-muted)"
					>
						Retirement mandate {inrCompact(mandateTarget)}
					</text>

					{/* Baseline */}
					<line
						x1={PAD_L}
						y1={H - PAD_B}
						x2={W - PAD_R}
						y2={H - PAD_B}
						stroke="var(--rule-strong)"
						strokeWidth="1"
					/>

					{/* The projection. This is where the accent is spent. */}
					<path
						d={projectionPath}
						fill="none"
						stroke="var(--stamp)"
						strokeWidth="2.5"
						strokeLinejoin="round"
						strokeLinecap="round"
					/>

					{traj.slice(0, -1).map((p) => (
						<circle
							key={p.year}
							cx={xOf(p.year)}
							cy={yOf(p.projected_corpus_inr)}
							r="2.5"
							fill="var(--stamp)"
						/>
					))}

					<circle
						cx={xOf(lastPoint.year)}
						cy={yOf(lastPoint.projected_corpus_inr)}
						r="5"
						fill="var(--stamp)"
					/>
					<text
						x={xOf(lastPoint.year)}
						y={yOf(lastPoint.projected_corpus_inr) - 16}
						textAnchor="end"
						fontSize="16"
						fontWeight="600"
						fill="var(--ink-strong)"
						style={{ fontVariantNumeric: "tabular-nums" }}
					>
						{inrCompact(lastPoint.projected_corpus_inr)}
					</text>

					{/* Year ticks */}
					{traj.map((p, i) => (
						<text
							key={p.year}
							x={xOf(p.year)}
							y={H - PAD_B + 22}
							textAnchor={
								i === 0 ? "start" : i === traj.length - 1 ? "end" : "middle"
							}
							fontSize="14"
							fill="var(--ink-muted)"
							style={{ fontVariantNumeric: "tabular-nums" }}
						>
							{p.year}
						</text>
					))}
				</svg>
			</section>

			{/* ---- Recommended allocation and goal feasibility ----------------- */}
			<div className="grid grid-cols-1 gap-rhythm lg:grid-cols-12">
				<section className="paper space-y-6 p-gutter reveal reveal-3 lg:col-span-7">
					<h3 className="doc-title text-lg">Recommended allocation</h3>

					<div className="flex h-4 w-full overflow-hidden border border-rule bg-paper-sunken">
						{SLEEVES.map((s, i) => (
							<div
								key={s.key}
								className={
									i < SLEEVES.length - 1 ? "border-r-2 border-paper-sheet" : ""
								}
								style={{
									width: `${currentSim.target_allocation[s.key]}%`,
									backgroundColor: s.ink,
								}}
							/>
						))}
					</div>

					<div className="divide-y divide-rule">
						{SLEEVES.map((s) => (
							<div
								key={s.key}
								className="flex flex-wrap items-baseline gap-x-8 gap-y-2 py-3.5"
							>
								<span className="flex w-28 items-center gap-2.5">
									<span
										className="size-2.5 shrink-0"
										style={{ backgroundColor: s.ink }}
									/>
									<span className="text-base text-ink">{s.name}</span>
								</span>
								<span className="figure-sm w-16 tabular-nums">
									{currentSim.target_allocation[s.key]}%
								</span>
								<span className="ml-auto text-sm tabular-nums text-ink-muted">
									{rupee((corpus * currentSim.target_allocation[s.key]) / 100)}{" "}
									at {lastPoint.year}
								</span>
							</div>
						))}
					</div>
				</section>

				<section className="paper space-y-6 p-gutter reveal reveal-3 lg:col-span-5">
					<h3 className="doc-title text-lg">Goals under this plan</h3>

					<div className="space-y-6">
						<div className="mark-quiet">
							<p className="label">Higher education, 2032</p>
							<p className="mt-1.5 text-base text-ink-strong">
								{currentSim.goals_feasibility.education_2032_status}
							</p>
						</div>
						<div className="mark-quiet">
							<p className="label">Financial independence, 2042</p>
							<p className="mt-1.5 text-base text-ink-strong">
								{currentSim.goals_feasibility.retirement_2042_status}
							</p>
						</div>
					</div>

					<p className="text-sm text-ink-muted">
						Projections assume the monthly commitment continues uninterrupted
						for the full {currentSim.horizon_years} years.
					</p>
				</section>
			</div>

			{/* ---- Assumptions. Every control still fires the simulator. ------- */}
			<section className="paper space-y-6 p-gutter reveal reveal-4">
				<div className="flex flex-wrap items-baseline justify-between gap-3">
					<h3 className="doc-title text-lg">Assumptions</h3>
					<p className="text-sm text-ink-muted">
						Each change re-runs the projection
					</p>
				</div>

				<div className="grid grid-cols-1 gap-rhythm lg:grid-cols-12">
					<div className="space-y-3 lg:col-span-7">
						<p className="label-strong">Market scenario</p>
						<div className="paper-sunken divide-y divide-rule">
							{SCENARIOS.map((sc) => {
								const active = activeScenario === sc.id;
								return (
									<button
										key={sc.id}
										type="button"
										onClick={() => handleScenarioChange(sc.id)}
										className={`flex w-full items-baseline justify-between gap-6 border-l-[3px] px-4 py-3.5 text-left transition-colors ${
											active
												? "border-l-ink-strong bg-paper-sheet"
												: "border-l-transparent hover:bg-paper-edge"
										}`}
									>
										<span className="min-w-0">
											<span
												className={
													active
														? "block text-base font-semibold text-ink-strong"
														: "block text-base text-ink"
												}
											>
												{sc.name}
											</span>
											<span className="mt-1 block text-sm text-ink-muted">
												{sc.note}
											</span>
										</span>
										<span
											className={`figure-sm shrink-0 tabular-nums ${
												active ? "" : "text-ink-muted"
											}`}
										>
											{pct(sc.cagr)}
										</span>
									</button>
								);
							})}
						</div>
					</div>

					<div className="space-y-8 paper-sunken p-5 lg:col-span-5">
						<div className="space-y-3">
							<div className="flex items-baseline justify-between gap-4">
								<span className="label-strong">Equity weight</span>
								<span className="figure-sm tabular-nums">{eqPct}%</span>
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
							<p className="text-sm text-ink-muted">
								Debt {Math.max(0, 95 - eqPct - 10)}%, gold 10%, liquid 5%
							</p>
						</div>

						<div className="space-y-3">
							<div className="flex items-baseline justify-between gap-4">
								<span className="label-strong">Monthly commitment</span>
								<span className="figure-sm tabular-nums">{rupee(sipAmt)}</span>
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
							<p className="text-sm text-ink-muted">
								The idle {rupee(90000)} surplus plus the {rupee(60000)} already
								running
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* ---- The document ------------------------------------------------ */}
			<section className="paper flex flex-col gap-6 p-gutter reveal reveal-5 sm:flex-row sm:items-center sm:justify-between">
				<div className="space-y-2">
					<h3 className="doc-title text-lg">Advisory proposal</h3>
					<p className="max-w-xl text-sm text-ink-muted">
						Sets out the rebalancing, the monthly commitment and the goal
						projection for the client to sign. Issued under the SEBI
						(Investment Advisers) Regulations, 2013.
					</p>
				</div>
				<Button
					onClick={handleGenerateProposal}
					className="h-11 shrink-0 gap-2 rounded-lg px-5 text-sm font-semibold"
				>
					<FileText className="size-4" />
					<span>Generate the proposal</span>
				</Button>
			</section>
		</div>
	);
}
