import { ArrowRight } from "@phosphor-icons/react";
import { useStore } from "@/store";
import { sendAction } from "@/ws";
import { Button } from "@/components/ui/button";
import { inrCompact, inrParts, pct, pctDelta, rupee } from "@/lib";

/* The strategic mandate the book is audited against. Identical to the weights
	 the goal simulation opens with, so the two pages tell one story. */
const MANDATE = { equity: 65, debt: 20, gold: 10, cash_liquid: 5 } as const;

/* One ink ramp for every chart in the studio: the weight of the ink follows
	 the weight of the holding. Ink only — the accent is never spent in a chart. */
const SLEEVES = [
	{ key: "equity", name: "Equity", ink: "var(--ink-strong)" },
	{ key: "debt", name: "Debt", ink: "var(--ink)" },
	{ key: "gold", name: "Gold", ink: "var(--ink-muted)" },
	{ key: "cash_liquid", name: "Cash", ink: "var(--ink-faint)" },
] as const;

export default function DiagnosticsView() {
	const { diagnostics, portfolio, profile, set } = useStore();
	const activeClient = portfolio || profile;

	const activeDiag = diagnostics || {
		client_name: activeClient?.name || "Rahul Sharma",
		total_aum_inr: activeClient?.total_aum_inr ?? 7500000,
		current_allocation: activeClient?.current_allocation || {
			equity: 0.7,
			debt: 0.15,
			gold: 0.1,
			cash_liquid: 0.05,
		},
		concentration_risks: activeClient?.portfolio_health_notes || [
			"80% of the equity book sits in a single large-cap fund.",
			"No allocation to mid and small cap growth, and none to global technology.",
			"Monthly cash surplus stays idle in the savings account.",
		],
		goals: activeClient?.goals || [
			{
				id: "GOAL-01",
				name: "Children's higher education",
				target_year: 2032,
				target_amount_inr: 5000000,
				current_funded_inr: 2200000,
				on_track: true,
			},
			{
				id: "GOAL-02",
				name: "Early financial independence",
				target_year: 2042,
				target_amount_inr: 50000000,
				current_funded_inr: 5300000,
				on_track: "needs_sip_boost",
			},
		],
		monthly_surplus_inr: activeClient?.monthly_surplus_inr ?? 150000,
		unallocated_surplus_inr: Math.max(
			0,
			(activeClient?.monthly_surplus_inr ?? 150000) -
				(activeClient?.active_sip_inr ?? 60000),
		),
	};

	const aum = activeDiag.total_aum_inr;
	const alloc = activeDiag.current_allocation;

	/* The finding: what the stated goals need, less what stands funded today. */
	const unfunded = activeDiag.goals.reduce(
		(sum, g) => sum + Math.max(0, g.target_amount_inr - g.current_funded_inr),
		0,
	);
	const committed = activeDiag.goals.reduce(
		(sum, g) => sum + g.target_amount_inr,
		0,
	);
	const funded = activeDiag.goals.reduce(
		(sum, g) => sum + g.current_funded_inr,
		0,
	);
	const fundedShare = committed ? (funded / committed) * 100 : 0;
	const gap = inrParts(unfunded);
	const horizon = Math.max(...activeDiag.goals.map((g) => g.target_year));
	const deployed = Math.max(
		0,
		activeDiag.monthly_surplus_inr - activeDiag.unallocated_surplus_inr,
	);

	const runSimulation = () => {
		set({ activeTab: "simulation", simulationOpen: true });
		sendAction("simulate_portfolio", {
			equity_pct: MANDATE.equity,
			debt_pct: MANDATE.debt,
			gold_pct: MANDATE.gold,
			liquid_pct: MANDATE.cash_liquid,
			monthly_sip_inr: 100000,
		});
	};

	return (
		<div className="space-y-rhythm pb-10">
			{/* ---- The finding ------------------------------------------------ */}
			<section className="paper reveal reveal-1">
				<div className="doc-rule" />
				<div className="space-y-7 p-gutter">
					<div className="flex flex-wrap items-baseline justify-between gap-3">
						<p className="label-strong">Portfolio audit</p>
						<p className="ref text-ink-muted">
							{activeDiag.client_name} &middot; {rupee(aum)} under advice
						</p>
					</div>

					<div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
						<div className="space-y-4">
							<h2 className="doc-title text-xl">Unfunded goal capital</h2>
							<div className="flex items-baseline gap-2">
								<span className="figure-xl">{gap.value}</span>
								<span className="figure-unit">{gap.unit}</span>
							</div>
							<p className="max-w-lg text-sm text-ink-muted">
								Across {activeDiag.goals.length} goals running to {horizon}.{" "}
								{inrCompact(funded)} of {inrCompact(committed)} committed is
								funded today, or {pct(fundedShare, 0)}.
							</p>
						</div>

						<Button
							onClick={runSimulation}
							className="h-11 shrink-0 gap-2 rounded-lg bg-stamp px-5 text-sm font-semibold text-stamp-foreground hover:bg-stamp-strong"
						>
							<span>Run the goal simulation</span>
							<ArrowRight className="size-4" />
						</Button>
					</div>
				</div>
			</section>

			{/* ---- Allocation against mandate --------------------------------- */}
			<section className="paper space-y-6 p-gutter reveal reveal-2">
				<div className="flex flex-wrap items-baseline justify-between gap-3">
					<h3 className="doc-title text-lg">Allocation against mandate</h3>
					<p className="ref text-ink-muted">Book {rupee(aum)}</p>
				</div>

				{/* The whole book as one rule of ink. No legend: the swatch on each
						row below is the key, and the row carries the number. */}
				<div className="flex h-4 w-full overflow-hidden border border-rule bg-paper-sunken">
					{SLEEVES.map((s, i) => (
						<div
							key={s.key}
							className={
								i < SLEEVES.length - 1 ? "border-r-2 border-paper-sheet" : ""
							}
							style={{
								width: `${alloc[s.key] * 100}%`,
								backgroundColor: s.ink,
							}}
						/>
					))}
				</div>

				<div className="divide-y divide-rule">
					{SLEEVES.map((s) => {
						const current = alloc[s.key] * 100;
						const target = MANDATE[s.key];
						const drift = current - target;
						const off = Math.abs(drift) >= 1;
						return (
							<div
								key={s.key}
								className={`flex flex-wrap items-baseline gap-x-8 gap-y-2 py-4 ${
									off ? "mark-attention" : "mark-quiet"
								}`}
							>
								<span className="flex w-28 items-center gap-2.5">
									<span
										className="size-2.5 shrink-0"
										style={{ backgroundColor: s.ink }}
									/>
									<span
										className={
											off
												? "text-base font-semibold text-ink-strong"
												: "text-base text-ink"
										}
									>
										{s.name}
									</span>
								</span>
								<span className="figure-sm w-16 tabular-nums">
									{pct(current, 0)}
								</span>
								<span className="w-32 text-sm tabular-nums text-ink-muted">
									{rupee(aum * alloc[s.key])}
								</span>
								<span className="text-sm text-ink-muted">
									Mandate {target}%
								</span>
								<span
									className={`ml-auto text-sm tabular-nums ${
										off ? "font-semibold text-ink-strong" : "text-ink-muted"
									}`}
								>
									{off ? pctDelta(drift, 0) : "On mandate"}
								</span>
							</div>
						);
					})}
				</div>
			</section>

			{/* ---- What the audit found --------------------------------------- */}
			<section className="paper space-y-5 p-gutter reveal reveal-3">
				<h3 className="doc-title text-lg">What the audit found</h3>
				<ol className="space-y-5">
					{activeDiag.concentration_risks.map((risk, i) => (
						<li key={i} className="mark-attention flex gap-4">
							<span className="ref shrink-0 pt-0.5 text-ink-muted">
								{i + 1}.
							</span>
							<p className="max-w-3xl text-sm leading-relaxed text-ink">
								{risk}
							</p>
						</li>
					))}
				</ol>
			</section>

			{/* ---- Goals and monthly cash ------------------------------------- */}
			<div className="grid grid-cols-1 gap-rhythm lg:grid-cols-12">
				<section className="paper space-y-6 p-gutter reveal reveal-4 lg:col-span-8">
					<h3 className="doc-title text-lg">Goals and funding</h3>

					<div className="space-y-7">
						{activeDiag.goals.map((g) => {
							const share = Math.min(
								100,
								(g.current_funded_inr / g.target_amount_inr) * 100,
							);
							const behind = g.on_track !== true;
							const shortfall = Math.max(
								0,
								g.target_amount_inr - g.current_funded_inr,
							);
							const parts = inrParts(shortfall);

							return (
								<div
									key={g.id}
									className={`space-y-3 ${
										behind ? "mark-attention" : "mark-quiet"
									}`}
								>
									<div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
										<div className="space-y-1.5">
											<p
												className={
													behind
														? "text-base font-semibold text-ink-strong"
														: "text-base text-ink"
												}
											>
												{g.name}
											</p>
											<p className="label">
												{g.id} &middot; Target {g.target_year}
											</p>
										</div>
										<div className="text-right">
											<div className="flex items-baseline justify-end gap-1.5">
												<span className="figure">{parts.value}</span>
												{parts.unit ? (
													<span className="figure-unit">{parts.unit}</span>
												) : null}
											</div>
											<p className="label mt-1.5">Still to fund</p>
										</div>
									</div>

									<div className="h-2 w-full border border-rule bg-paper-sunken">
										<div
											className="h-full"
											style={{
												width: `${share}%`,
												backgroundColor: behind
													? "var(--ink-strong)"
													: "var(--ink-muted)",
											}}
										/>
									</div>

									<div className="flex flex-wrap justify-between gap-x-6 gap-y-1 text-sm text-ink-muted">
										<span className="tabular-nums">
											{rupee(g.current_funded_inr)} funded of{" "}
											{rupee(g.target_amount_inr)}
										</span>
										<span
											className={
												behind
													? "font-semibold text-ink-strong"
													: "text-ink-muted"
											}
										>
											{behind
												? "Needs a larger monthly commitment"
												: "On track"}{" "}
											&middot;{" "}
											<span className="tabular-nums">{pct(share, 0)}</span>{" "}
											funded
										</span>
									</div>
								</div>
							);
						})}
					</div>
				</section>

				<section className="paper flex flex-col justify-between gap-6 p-gutter reveal reveal-5 lg:col-span-4">
					<div className="space-y-6">
						<h3 className="doc-title text-lg">Monthly cash</h3>

						<div className="paper-sunken px-4 py-3.5">
							<p className="label">Investable surplus</p>
							<p className="figure mt-1.5">
								{rupee(activeDiag.monthly_surplus_inr)}
							</p>
							<p className="mt-1.5 text-sm text-ink-muted">
								Every month, after household commitments
							</p>
						</div>

						<div className="mark-attention">
							<p className="label">Idle in savings</p>
							<p className="figure mt-1.5">
								{rupee(activeDiag.unallocated_surplus_inr)}
							</p>
							<p className="mt-1.5 text-sm text-ink-muted">
								Uninvested each month, earning below inflation
							</p>
						</div>

						<div className="mark-quiet">
							<p className="label">Committed to SIPs</p>
							<p className="figure-sm mt-1.5">{rupee(deployed)}</p>
							<p className="mt-1.5 text-sm text-ink-muted">
								Running against the education goal
							</p>
						</div>
					</div>

					<Button
						variant="ghost"
						onClick={() => {
							set({ activeTab: "explorer" });
						}}
						className="h-11 w-full justify-between rounded-lg border border-rule px-4 text-sm font-medium text-ink hover:bg-paper-sunken"
					>
						<span>Deploy the surplus</span>
						<ArrowRight className="size-4" />
					</Button>
				</section>
			</div>
		</div>
	);
}
