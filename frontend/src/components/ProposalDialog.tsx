import { DownloadSimple as Download } from "@phosphor-icons/react";
import { useStore } from "@/store";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { inr, inrCompact } from "@/lib";

/* ---------------------------------------------------------------------------
   The advisory proposal is the document the client signs against. It is set
   the way a prospectus is: a certificate rule at the head, a Caslon title,
   the document number in monospace beneath it, 12px field heads over 15px
   values, and the recommended schedule as a ruled tabular list. The one
   accent on this surface is the attestation seal — the adviser's SEBI
   registration — because that is the fact that makes the paper credible.
   ------------------------------------------------------------------------ */

/** The adviser's SEBI registration, printed on every proposal it issues. */
const ADVISER_REGISTRATION = "INA000012345";

export default function ProposalDialog() {
	const { proposal, proposalOpen, portfolio, profile, set } = useStore();

	const documentId = proposal?.proposal_id || "CYMBAL-PROP-2026-0881";
	const clientName =
		proposal?.client_name || portfolio?.name || profile?.name || "Rahul Sharma";
	const issuedOn = proposal?.date || "17 August 2026";
	const monthly = proposal?.total_sip_inr ?? 60000;
	const lumpsum = proposal?.total_lumpsum_inr ?? 0;
	const firstYear = monthly * 12 + lumpsum;
	const items = proposal?.basket_items ?? [];

	return (
		<Dialog
			open={proposalOpen}
			onOpenChange={(open) => set({ proposalOpen: open })}
		>
			<DialogContent className="max-w-lg gap-0 overflow-hidden rounded-lg border border-rule bg-paper-sheet p-0 text-ink shadow-raise">
				{/* Head of the document */}
				<DialogHeader className="doc-rule space-y-0 px-gutter pb-5 pt-6 text-left">
					<p className="label">Advisory proposal</p>
					<DialogTitle className="doc-title mt-2 text-xl font-normal">
						Strategic wealth advisory proposal
					</DialogTitle>
					<DialogDescription className="ref mt-2">
						{documentId}
					</DialogDescription>
				</DialogHeader>

				<div className="max-h-[72vh] space-y-rhythm overflow-y-auto px-gutter pb-6">
					{/* The attestation — the single accent on this document */}
					<div className="flex items-center justify-between border-t border-rule pt-5">
						<span className="stamp-mark">SEBI registered adviser</span>
						<p className="ref text-ink-faint">{ADVISER_REGISTRATION}</p>
					</div>

					<div className="grid grid-cols-2 gap-x-6 gap-y-4">
						<div>
							<p className="label">Client</p>
							<p className="mt-1.5 text-sm text-ink-strong">{clientName}</p>
						</div>
						<div>
							<p className="label">Issued</p>
							<p className="mt-1.5 text-sm text-ink-strong">{issuedOn}</p>
						</div>
						<div>
							<p className="label">Prepared by</p>
							<p className="mt-1.5 text-sm text-ink-strong">
								Ananya, Senior Relationship Manager
							</p>
						</div>
						<div>
							<p className="label">Review cycle</p>
							<p className="mt-1.5 text-sm text-ink-strong">
								Half-yearly, next February
							</p>
						</div>
					</div>

					{/* The commitment, at hero scale */}
					<div className="paper-sunken px-5 py-5">
						<div className="flex items-end justify-between">
							<div>
								<p className="label">Monthly commitment</p>
								<p className="figure-lg mt-2 tabular-nums">{inr(monthly)}</p>
							</div>
							<span className="figure-unit pb-2">per month</span>
						</div>
						<div className="mt-4 flex items-baseline justify-between border-t border-rule pt-4">
							<p className="label">One-time deployment</p>
							<p className="figure-sm tabular-nums">{inr(lumpsum)}</p>
						</div>
						<div className="mt-3 flex items-baseline justify-between">
							<p className="label">First-year commitment</p>
							<p className="figure-sm tabular-nums">{inrCompact(firstYear)}</p>
						</div>
					</div>

					{/* The recommended schedule */}
					{items.length > 0 && (
						<div>
							<div className="flex items-baseline justify-between border-b border-rule-strong pb-2">
								<p className="label-strong">Recommended schedule</p>
								<p className="label">
									{items.length}{" "}
									{items.length === 1 ? "instrument" : "instruments"}
								</p>
							</div>
							<ul className="max-h-44 divide-y divide-rule overflow-y-auto scrollbar-none">
								{items.map((item) => (
									<li
										key={item.product_id}
										className="flex items-baseline justify-between gap-4 py-3"
									>
										<div className="min-w-0">
											<p className="truncate text-sm text-ink-strong">
												{item.name}
											</p>
											<p className="ref mt-1">{item.product_id}</p>
										</div>
										<div className="shrink-0 text-right">
											<p className="figure-sm tabular-nums">
												{inr(item.monthly_sip_inr || item.lumpsum_inr)}
											</p>
											<p className="label mt-1">
												{item.monthly_sip_inr ? "per month" : "one-time"}
											</p>
										</div>
									</li>
								))}
							</ul>
						</div>
					)}

					{proposal?.strategic_rationale && (
						<div className="border-t border-rule pt-5">
							<p className="label-strong">Rationale</p>
							<p className="mt-2 text-sm leading-relaxed text-ink">
								{proposal.strategic_rationale}
							</p>
						</div>
					)}

					<div className="border-t border-rule pt-5">
						<p className="label-strong">Statutory disclosure</p>
						<p className="mt-2 text-xs leading-relaxed text-ink-muted">
							Mutual fund investments are subject to market risk. Read all
							scheme related documents carefully. Past performance does not
							indicate future returns. This proposal sets out the asset shift
							matrix, allocation weighting and disclosures required under SEBI
							(Investment Advisers) Regulations, 2013.
						</p>
					</div>

					<div className="space-y-2.5">
						{proposal?.download_url && (
							<Button
								asChild
								variant="wealth"
								className="h-11 w-full gap-2 rounded-lg text-sm font-semibold"
							>
								<a
									href={proposal.download_url}
									target="_blank"
									rel="noopener noreferrer"
								>
									<Download className="size-4" />
									<span>Download proposal</span>
								</a>
							</Button>
						)}

						<Button
							variant="outline"
							onClick={() => set({ proposalOpen: false })}
							className="h-11 w-full rounded-lg text-sm font-semibold"
						>
							Close
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
