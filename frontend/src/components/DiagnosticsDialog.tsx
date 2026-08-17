import {
	ShieldAlert,
	AlertTriangle,
	TrendingUp,
	PieChart,
} from "lucide-react";
import { useStore } from "@/store";
import { sendAction } from "@/ws";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export default function DiagnosticsDialog() {
	const { diagnosticsOpen, diagnostics, set } = useStore();

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
		<Dialog
			open={diagnosticsOpen}
			onOpenChange={(open) => set({ diagnosticsOpen: open })}
		>
			<DialogContent className="max-w-2xl p-0 overflow-hidden">
				{/* Header */}
				<DialogHeader className="p-5 bg-gradient-to-r from-slate-900 to-[#0B2545] text-white">
					<div className="flex items-center gap-3">
						<div className="size-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
							<ShieldAlert className="size-5" />
						</div>
						<div>
							<DialogTitle className="text-white text-base">
								Portfolio Diagnostics & Health Check
							</DialogTitle>
							<DialogDescription className="text-slate-300">
								Asset allocation skew & concentration risk audit for Rahul Sharma
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				{/* Content */}
				<div className="p-6 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
					{/* Concentration Alerts */}
					<div className="space-y-2">
						<h4 className="font-bold text-foreground flex items-center gap-1.5">
							<AlertTriangle className="size-3.5 text-amber-600" />
							<span>Diagnostic Findings & Asset Concentration Risks</span>
						</h4>
						<div className="space-y-2">
							{activeDiag.concentration_risks.map((risk, i) => (
								<Alert key={i} variant="warning" className="p-3">
									<AlertDescription className="text-xs text-amber-950 dark:text-amber-200">
										{risk}
									</AlertDescription>
								</Alert>
							))}
						</div>
					</div>

					{/* Current Asset Allocation Breakdown */}
					<div className="space-y-2">
						<h4 className="font-bold text-foreground flex items-center gap-1.5">
							<PieChart className="size-3.5 text-blue-600" />
							<span>Current Allocation Breakdown (₹75 Lakh Total AUM)</span>
						</h4>
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
							<div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/30">
								<p className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-300">
									Equity (70%)
								</p>
								<p className="font-extrabold text-indigo-950 dark:text-indigo-100 mt-0.5">
									₹52.5 L
								</p>
							</div>
							<div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30">
								<p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
									Debt (15%)
								</p>
								<p className="font-extrabold text-emerald-950 dark:text-emerald-100 mt-0.5">
									₹11.25 L
								</p>
							</div>
							<div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30">
								<p className="text-[10px] font-semibold text-amber-800 dark:text-amber-300">
									Gold (10%)
								</p>
								<p className="font-extrabold text-amber-950 dark:text-amber-100 mt-0.5">
									₹7.5 L
								</p>
							</div>
							<div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
								<p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
									Liquid (5%)
								</p>
								<p className="font-extrabold text-foreground mt-0.5">₹3.75 L</p>
							</div>
						</div>
					</div>

					{/* Goal Milestones */}
					<div className="space-y-2">
						<h4 className="font-bold text-foreground flex items-center gap-1.5">
							<TrendingUp className="size-3.5 text-emerald-600" />
							<span>Goal Milestones & Funding Progress</span>
						</h4>
						<div className="space-y-2.5">
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
										className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2"
									>
										<div className="flex justify-between font-semibold">
											<span className="font-bold text-foreground">
												{g.name} ({g.target_year})
											</span>
											<span className="text-muted-foreground">
												₹{(g.current_funded_inr / 100000).toFixed(1)}L / ₹
												{(g.target_amount_inr / 100000).toFixed(0)}L ({pct}%)
											</span>
										</div>
										<Progress value={pct} className="h-2" />
									</div>
								);
							})}
						</div>
					</div>

					{/* Action button */}
					<Button
						variant="wealth"
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
						className="w-full h-10 font-bold text-xs"
					>
						Launch Rebalancing & Goal Simulation
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
