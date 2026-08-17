import {
	FileText,
	Download,
	CheckCircle2,
} from "lucide-react";
import { useStore } from "@/store";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function ProposalDialog() {
	const { proposalOpen, proposal, set } = useStore();

	return (
		<Dialog
			open={proposalOpen}
			onOpenChange={(open) => set({ proposalOpen: open })}
		>
			<DialogContent className="max-w-lg p-0 overflow-hidden">
				{/* Header */}
				<DialogHeader className="p-5 bg-gradient-to-r from-slate-900 to-[#0B2545] text-white">
					<div className="flex items-center gap-3">
						<div className="size-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
							<FileText className="size-5" />
						</div>
						<div>
							<DialogTitle className="text-white text-base">
								Strategic Wealth Advisory Proposal
							</DialogTitle>
							<DialogDescription className="text-slate-300">
								Document ID: {proposal?.proposal_id || "CYMBAL-PROP-2026-0881"}
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				{/* Content */}
				<div className="p-6 space-y-4 text-xs">
					<Alert variant="success" className="p-3.5 flex items-center gap-3">
						<CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
						<div>
							<AlertTitle className="font-bold text-xs text-emerald-950 dark:text-emerald-100">
								Proposal PDF Generated
							</AlertTitle>
							<AlertDescription className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-0.5">
								Complete with asset shift matrix, advisory basket allocations, and SEBI statutory disclaimers.
							</AlertDescription>
						</div>
					</Alert>

					<div className="p-3.5 bg-muted/40 rounded-2xl border border-border space-y-2">
						<div className="flex justify-between text-muted-foreground">
							<span>Client Name:</span>
							<span className="font-bold text-foreground">
								{proposal?.client_name || "Rahul Sharma"}
							</span>
						</div>
						<div className="flex justify-between text-muted-foreground">
							<span>Total Monthly SIP:</span>
							<span className="font-bold text-emerald-700 dark:text-emerald-400">
								₹{proposal?.total_sip_inr?.toLocaleString() || "60,000"} / mo
							</span>
						</div>
						<div className="flex justify-between text-muted-foreground">
							<span>Total Lump Sum:</span>
							<span className="font-bold text-foreground">
								₹{proposal?.total_lumpsum_inr?.toLocaleString() || "0"}
							</span>
						</div>
						{proposal?.strategic_rationale && (
							<div className="pt-2 border-t border-border text-[11px]">
								<p className="font-bold text-foreground mb-0.5">
									Strategic Rationale:
								</p>
								<p className="text-muted-foreground leading-relaxed">
									{proposal.strategic_rationale}
								</p>
							</div>
						)}
					</div>

					{/* Download & View Actions */}
					<div className="space-y-2 pt-2">
						{proposal?.download_url && (
							<Button
								asChild
								variant="wealth"
								className="w-full h-11 font-bold text-xs gap-2 shadow-md"
							>
								<a
									href={proposal.download_url}
									target="_blank"
									rel="noopener noreferrer"
								>
									<Download className="size-4 text-amber-300" />
									<span>Download Official Proposal PDF</span>
								</a>
							</Button>
						)}

						<Button
							variant="outline"
							onClick={() => set({ proposalOpen: false })}
							className="w-full h-9 font-bold text-xs"
						>
							Close
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
