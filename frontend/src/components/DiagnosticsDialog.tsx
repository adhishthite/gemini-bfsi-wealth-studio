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
import { inr, inrCompact, inrParts, pct } from "@/lib";
import type { DiagnosticsData } from "@/types";

/* ---------------------------------------------------------------------------
   The portfolio audit, set as a review note rather than a dashboard. State is
   carried by rule-lines: a solid left rule marks a gap that needs attention,
   a faint one marks a goal that is on track. No status colours. The single
   accent is the action the audit leads to — running the simulation.
   ------------------------------------------------------------------------ */

/** Allocations arrive either as fractions (0.7) or as percentages (70). */
const asPct = (v: number) => (Math.abs(v) <= 1 ? v * 100 : v);

const FOLIO = "CYM-PMS-0091447";

export default function DiagnosticsDialog() {
	const { diagnosticsOpen, diagnostics, portfolio, profile, set } = useStore();
	const activeClient = portfolio || profile;

	const activeDiag: DiagnosticsData = diagnostics || {
		client_name: activeClient?.name || "Rahul Sharma",
		total_aum_inr: activeClient?.total_aum_inr ?? 7500000,
		current_allocation: activeClient?.current_allocation || {
			equity: 0.7,
			debt: 0.15,
			gold: 0.1,
			cash_liquid: 0.05,
		},
		concentration_risks: activeClient?.portfolio_health_notes || [
			"80% of the equity book sits in a single large cap fund — concentration well beyond the client's stated risk mandate.",
			"No allocation to mid and small cap growth, and none to global technology. The book has no diversification outside India.",
			"Monthly cash surplus is sitting idle in the savings account, earning 3%.",
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
				name: "Financial independence at 54",
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
	const aumParts = inrParts(aum);

	const sleeves = [
		{ label: "Equity", share: asPct(alloc.equity) },
		{ label: "Debt", share: asPct(alloc.debt) },
		{ label: "Gold", share: asPct(alloc.gold) },
		{ label: "Cash", share: asPct(alloc.cash_liquid) },
	];

	return (
		<Dialog
			open={diagnosticsOpen}
			onOpenChange={(open) => set({ diagnosticsOpen: open })}
		>
			<DialogContent className="max-w-2xl gap-0 overflow-hidden rounded-lg border border-rule bg-paper-sheet p-0 text-ink shadow-raise">
				<DialogHeader className="doc-rule space-y-0 px-gutter pb-5 pt-6 text-left">
					<p className="label">Portfolio review</p>
					<DialogTitle className="doc-title mt-2 text-xl font-normal">
						Portfolio diagnostics
					</DialogTitle>
					<DialogDescription className="ref mt-2">
						{activeDiag.client_name || "Rahul Sharma"} · Folio {FOLIO}
					</DialogDescription>
				</DialogHeader>

				<div className="max-h-[72vh] space-y-rhythm overflow-y-auto px-gutter pb-6">
					{/* Assets under advice, at hero scale */}
					<div className="flex items-end justify-between border-t border-rule pt-5">
						<div>
							<p className="label">Assets under advice</p>
							<p className="figure-lg mt-2 tabular-nums">{aumParts.value}</p>
						</div>
						<span className="figure-unit pb-2">{aumParts.unit}</span>
					</div>

					{/* Allocation, as a column of figures */}
					<div>
						<div className="flex items-baseline justify-between border-b border-rule-strong pb-2">
							<p className="label-strong">Current allocation</p>
							<p className="label">Four sleeves</p>
						</div>
						<div className="grid grid-cols-2 divide-rule sm:grid-cols-4 sm:divide-x">
							{sleeves.map((sleeve) => (
								<div
									key={sleeve.label}
									className="px-0 py-4 sm:px-5 sm:first:pl-0"
								>
									<p className="label">{sleeve.label}</p>
									<p className="figure mt-2 tabular-nums">
										{pct(sleeve.share, 0)}
									</p>
									<p className="mt-1.5 text-xs text-ink-muted tabular-nums">
										{inrCompact((aum * sleeve.share) / 100)}
									</p>
								</div>
							))}
						</div>
					</div>

					{/* Findings — each one a gap, marked by a rule not a colour */}
					<div>
						<p className="label-strong border-b border-rule-strong pb-2">
							Findings
						</p>
						<div className="space-y-4 pt-4">
							{activeDiag.concentration_risks.map((risk, i) => (
								<div key={i} className="mark-attention py-0.5">
									<p className="text-sm leading-relaxed text-ink">{risk}</p>
								</div>
							))}
						</div>
					</div>

					{/* Goals — funded against target */}
					<div>
						<div className="flex items-baseline justify-between border-b border-rule-strong pb-2">
							<p className="label-strong">Goals</p>
							<p className="label">Funded against target</p>
						</div>
						<div className="divide-y divide-rule">
							{activeDiag.goals.map((goal) => {
								const funded =
									goal.target_amount_inr > 0
										? (goal.current_funded_inr / goal.target_amount_inr) * 100
										: 0;
								const onTrack = goal.on_track === true;
								return (
									<div
										key={goal.id}
										className={`py-4 ${onTrack ? "mark-quiet" : "mark-attention"}`}
									>
										<div className="flex items-baseline justify-between gap-4">
											<div className="min-w-0">
												<p className="text-sm text-ink-strong">{goal.name}</p>
												<p className="mt-1 text-xs text-ink-muted">
													Target {goal.target_year} ·{" "}
													{onTrack ? "On track" : "Needs a higher SIP"}
												</p>
											</div>
											<div className="shrink-0 text-right">
												<p className="figure-sm tabular-nums">
													{inrCompact(goal.current_funded_inr)}
												</p>
												<p className="label mt-1">
													of {inrCompact(goal.target_amount_inr)}
												</p>
											</div>
										</div>
										<div className="mt-3 h-0.5 w-full bg-rule">
											<div
												className="h-0.5 bg-ink-strong"
												style={{ width: `${Math.min(100, funded)}%` }}
											/>
										</div>
										<p className="mt-1.5 text-xs text-ink-faint tabular-nums">
											{pct(funded, 0)} funded
										</p>
									</div>
								);
							})}
						</div>
					</div>

					{/* The gap the whole review turns on */}
					<div className="paper-sunken flex items-end justify-between px-5 py-4">
						<div>
							<p className="label">Monthly surplus sitting idle</p>
							<p className="figure-lg mt-2 tabular-nums">
								{inr(activeDiag.unallocated_surplus_inr)}
							</p>
							<p className="mt-2 text-xs text-ink-muted tabular-nums">
								of {inr(activeDiag.monthly_surplus_inr)} available each month
							</p>
						</div>
						<span className="figure-unit pb-2">per month</span>
					</div>

					<Button
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
						className="h-11 w-full rounded-lg bg-stamp text-sm font-semibold text-stamp-foreground hover:bg-stamp-strong"
					>
						Run rebalancing simulation
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
