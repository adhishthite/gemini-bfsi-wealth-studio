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
import { Button } from "@/components/ui/button";

export default function ProposalDialog() {
	const { proposalOpen, proposal, set } = useStore();

	return (
		<Dialog
			open={proposalOpen}
			onOpenChange={(open) => set({ proposalOpen: open })}
		>
			<DialogContent className="max-w-lg p-0 overflow-hidden bg-[#0A111E] border border-white/15 text-slate-200 shadow-2xl rounded-2xl">
				{/* Header */}
				<DialogHeader className="p-5 bg-slate-950/90 border-b border-white/10 text-white">
					<div className="flex items-center gap-3">
						<div className="size-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-xs">
							<FileText className="size-5" />
						</div>
						<div>
							<DialogTitle className="text-white text-base">
								Strategic Wealth Advisory Proposal
							</DialogTitle>
							<DialogDescription className="text-slate-400 text-xs">
								Document ID: {proposal?.proposal_id || "CYMBAL-PROP-2026-0881"}
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				{/* Content */}
				<div className="p-6 space-y-4 text-xs">
					<div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center gap-3">
						<CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
						<div>
							<p className="font-bold text-xs text-white">
								Proposal PDF Successfully Generated
							</p>
							<p className="text-[11px] text-emerald-300/90 mt-0.5">
								Asset shift matrix, strategic allocation weighting, and statutory SEBI disclaimers compiled.
							</p>
						</div>
					</div>

					<div className="p-4 bg-slate-950/70 rounded-2xl border border-white/10 space-y-2">
						<div className="flex justify-between text-slate-400">
							<span>Client Name:</span>
							<span className="font-bold text-white">
								{proposal?.client_name || "Rahul Sharma"}
							</span>
						</div>
						<div className="flex justify-between text-slate-400">
							<span>Total Monthly SIP:</span>
							<span className="font-mono font-black text-emerald-400">
								₹{proposal?.total_sip_inr?.toLocaleString() || "60,000"} / mo
							</span>
						</div>
						<div className="flex justify-between text-slate-400">
							<span>Total Lump Sum:</span>
							<span className="font-mono font-bold text-slate-200">
								₹{proposal?.total_lumpsum_inr?.toLocaleString() || "0"}
							</span>
						</div>
						{proposal?.strategic_rationale && (
							<div className="pt-2 border-t border-white/10 text-[11px]">
								<p className="font-bold text-amber-300 mb-0.5">
									Strategic Rationale:
								</p>
								<p className="text-slate-300 leading-relaxed">
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
								className="w-full h-11 font-bold text-xs gap-2 bg-amber-400 text-slate-950 hover:bg-amber-300 rounded-xl shadow-xs"
							>
								<a
									href={proposal.download_url}
									target="_blank"
									rel="noopener noreferrer"
								>
									<Download className="size-4 text-slate-950" />
									<span>Download Official Proposal PDF</span>
								</a>
							</Button>
						)}

						<Button
							variant="outline"
							onClick={() => set({ proposalOpen: false })}
							className="w-full h-9 font-bold text-xs bg-slate-900 border-white/10 text-slate-300 hover:text-white rounded-xl"
						>
							Close
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

