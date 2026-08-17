import {
	X,
	FileText,
	Download,
	CheckCircle2,
	ShieldCheck,
	ExternalLink,
} from "lucide-react";
import { useStore } from "../store";

export default function ProposalModal() {
	const { proposalOpen, proposal, set } = useStore();

	if (!proposalOpen || !proposal) return null;

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
			<div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
				{/* Header */}
				<div className="p-5 border-b border-slate-100 bg-[#0B2545] text-white flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="h-9 w-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
							<FileText size={20} />
						</div>
						<div>
							<h3 className="text-sm font-bold">
								Strategic Wealth Advisory Proposal
							</h3>
							<p className="text-[11px] text-slate-300">
								Document ID: {proposal.proposal_id}
							</p>
						</div>
					</div>
					<button
						onClick={() => set({ proposalOpen: false })}
						className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
					>
						<X size={16} />
					</button>
				</div>

				{/* Content */}
				<div className="p-6 space-y-4 text-xs">
					<div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
						<CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
						<div>
							<p className="font-bold text-emerald-950 text-xs">
								Proposal PDF Generated
							</p>
							<p className="text-[11px] text-emerald-800 mt-0.5">
								Complete with asset shift matrix, advisory basket allocations,
								and SEBI statutory disclaimers.
							</p>
						</div>
					</div>

					<div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
						<div className="flex justify-between text-slate-500">
							<span>Client Name:</span>
							<span className="font-bold text-slate-900">
								{proposal.client_name || "Rahul Sharma"}
							</span>
						</div>
						<div className="flex justify-between text-slate-500">
							<span>Total Monthly SIP:</span>
							<span className="font-bold text-emerald-700">
								₹{proposal.total_sip_inr?.toLocaleString()} / mo
							</span>
						</div>
						<div className="flex justify-between text-slate-500">
							<span>Total Lump Sum:</span>
							<span className="font-bold text-slate-900">
								₹{proposal.total_lumpsum_inr?.toLocaleString()}
							</span>
						</div>
						{proposal.strategic_rationale && (
							<div className="pt-2 border-t border-slate-200 text-[11px]">
								<p className="font-bold text-slate-700 mb-0.5">
									Strategic Rationale:
								</p>
								<p className="text-slate-600 leading-relaxed">
									{proposal.strategic_rationale}
								</p>
							</div>
						)}
					</div>

					{/* Download & View Actions */}
					<div className="space-y-2 pt-2">
						<a
							href={proposal.download_url}
							target="_blank"
							rel="noopener noreferrer"
							className="w-full py-3 px-4 rounded-xl bg-[#0B2545] hover:bg-[#134074] text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md"
						>
							<Download size={15} className="text-amber-300" />
							<span>Download Official Proposal PDF</span>
						</a>

						<button
							onClick={() => set({ proposalOpen: false })}
							className="w-full py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
						>
							Close
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
