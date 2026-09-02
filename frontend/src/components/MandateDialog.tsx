import { useState } from "react";
import type { ReactNode } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@/components/ui/input-otp";
import { inr } from "@/lib";

/* ---------------------------------------------------------------------------
   The e-NACH mandate is an instrument, not a modal. It is set as a document:
   a certificate rule at the head, a Caslon instruction title, a monospaced
   UMRN beneath it, field heads at 12px over 15px values, and the debit
   schedule as a ruled tabular list. The single accent on this surface is
   spent once — on the authorise action before execution, and on the
   attestation seal after it.
   ------------------------------------------------------------------------ */

/** Unique Mandate Registration Number — this instrument's own identifier. */
const UMRN = "CYMB6421078821";

/** The registered debits, shown on the executed instrument when the staged
 *  basket has already been cleared by the backend. */
const REGISTERED_DEBITS = [
	{
		name: "Cymbal Flexi Cap Opportunities Fund",
		ref: "INF200K01WT4",
		amount: 35000,
	},
	{
		name: "Cymbal Multi-Asset Strategy Fund",
		ref: "INF200K01XR2",
		amount: 25000,
	},
	{
		name: "Cymbal CRISIL SDL 2030 Index Fund",
		ref: "INF200K01YH9",
		amount: 20000,
	},
	{
		name: "Cymbal US & Global Tech Feeder Fund",
		ref: "INF200K01ZB6",
		amount: 20000,
	},
];

type DebitLine = {
	name: string;
	ref: string;
	amount: number;
	recurring: boolean;
};

function Field({
	label,
	value,
	mono,
}: {
	label: string;
	value: ReactNode;
	mono?: boolean;
}) {
	return (
		<div>
			<p className="label">{label}</p>
			<p
				className={
					mono ? "ref mt-1.5 text-ink-strong" : "mt-1.5 text-sm text-ink-strong"
				}
			>
				{value}
			</p>
		</div>
	);
}

function DebitSchedule({
	heading,
	lines,
}: {
	heading: string;
	lines: DebitLine[];
}) {
	return (
		<div>
			<div className="flex items-baseline justify-between border-b border-rule-strong pb-2">
				<p className="label-strong">{heading}</p>
				<p className="label">
					{lines.length} {lines.length === 1 ? "instrument" : "instruments"}
				</p>
			</div>
			{lines.length === 0 ? (
				<p className="py-4 text-sm text-ink-muted">
					No instruments staged. Add funds to the advisory basket first.
				</p>
			) : (
				<ul className="max-h-44 divide-y divide-rule overflow-y-auto scrollbar-none">
					{lines.map((line) => (
						<li
							key={line.ref}
							className="flex items-baseline justify-between gap-4 py-3"
						>
							<div className="min-w-0">
								<p className="truncate text-sm text-ink-strong">{line.name}</p>
								<p className="ref mt-1">{line.ref}</p>
							</div>
							<div className="shrink-0 text-right">
								<p className="figure-sm tabular-nums">{inr(line.amount)}</p>
								<p className="label mt-1">
									{line.recurring ? "per month" : "one-time"}
								</p>
							</div>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

export default function MandateDialog() {
	const {
		mandateModalOpen,
		mandateStatus,
		basket,
		totalSip,
		portfolio,
		lastTransactionId,
		set,
		pushToast,
	} = useStore();

	const defaultOtp = portfolio?.user_id
		? portfolio.user_id.split("-").pop() || "7701"
		: "7701";
	const [otp, setOtp] = useState(defaultOtp);
	const [agreed, setAgreed] = useState(true);

	// Sync OTP whenever active client changes
	useState(() => {
		if (defaultOtp !== otp) setOtp(defaultOtp);
	});

	const authorized = mandateStatus === "authorized";
	const failed = mandateStatus === "error";

	const handleAuthorize = () => {
		if (!agreed) {
			pushToast(
				"Accept the statutory declaration to authorise the mandate",
				"warning",
			);
			return;
		}
		sendAction("execute_mandate", { otp });
	};

	const handleClose = () => {
		set({ mandateModalOpen: false });
	};

	const debits: DebitLine[] = basket.length
		? basket.map((b) => ({
				name: b.name,
				ref: b.product_id,
				amount: b.monthly_sip_inr || b.lumpsum_inr,
				recurring: Boolean(b.monthly_sip_inr),
			}))
		: authorized
			? REGISTERED_DEBITS.map((d) => ({ ...d, recurring: true }))
			: [];

	const monthlyDebit =
		totalSip ||
		debits.filter((d) => d.recurring).reduce((sum, d) => sum + d.amount, 0);

	const bank = portfolio?.bank_account?.bank || "Cymbal Premier Private Bank";
	const last4 = portfolio?.bank_account?.account_number_last4 || "8821";
	const txnId = lastTransactionId || "CYMB-TXN-2026-004417";

	return (
		<Dialog
			open={mandateModalOpen}
			onOpenChange={(open) => set({ mandateModalOpen: open })}
		>
			<DialogContent className="max-w-lg gap-0 overflow-hidden rounded-lg border border-rule bg-paper-sheet p-0 text-ink shadow-raise">
				{/* Head of the instrument: certificate rule, document voice, reference */}
				<DialogHeader className="doc-rule space-y-0 px-gutter pb-5 pt-6 text-left">
					<p className="label">
						{authorized ? "Executed instrument" : "Instruction to debit"}
					</p>
					<DialogTitle className="doc-title mt-2 text-xl font-normal">
						{authorized ? "Mandate authorised" : "e-NACH mandate authorisation"}
					</DialogTitle>
					<DialogDescription className="ref mt-2">
						UMRN {UMRN}
					</DialogDescription>
				</DialogHeader>

				<div className="max-h-[72vh] space-y-rhythm overflow-y-auto px-gutter pb-6">
					{failed && (
						<div className="mark-attention py-1">
							<p className="text-sm font-semibold text-ink-strong">
								Authorisation did not go through
							</p>
							<p className="mt-1 text-xs text-ink-muted">
								The code entered does not match the one sent to the client's
								registered mobile. Re-enter the four-digit code and authorise
								again. The mandate has not been registered and no debit has been
								raised.
							</p>
						</div>
					)}

					{!authorized ? (
						<>
							<div className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-rule pt-5">
								<Field label="Debit account" value={bank} />
								<Field
									label="Account number"
									value={`XXXX XXXX ${last4}`}
									mono
								/>
								<Field label="Frequency" value="Monthly, 5th of each month" />
								<Field label="Valid until" value="Cancelled by the client" />
							</div>

							<div className="paper-sunken flex items-end justify-between px-5 py-4">
								<div>
									<p className="label">Monthly debit</p>
									<p className="figure-lg mt-2 tabular-nums">
										{inr(monthlyDebit)}
									</p>
								</div>
								<span className="figure-unit pb-2">per month</span>
							</div>

							<DebitSchedule heading="Debit schedule" lines={debits} />

							<div className="paper-sunken flex items-start gap-3 px-5 py-4">
								<Checkbox
									id="sebi-consent"
									checked={agreed}
									onCheckedChange={(checked) => setAgreed(!!checked)}
									className="mt-0.5 border-rule-strong"
								/>
								<Label
									htmlFor="sebi-consent"
									className="cursor-pointer text-xs font-normal leading-relaxed text-ink-muted"
								>
									The client authorises Cymbal Premier to register an e-NACH
									auto-debit on the account above, and acknowledges that mutual
									fund investments carry market risk as set out under SEBI
									regulations.
								</Label>
							</div>

							<div className="border-t border-rule pt-5">
								<div className="flex items-baseline justify-between">
									<p className="label-strong">One-time password</p>
									<p className="ref text-ink-faint">Demo code 7701</p>
								</div>
								<p className="mt-1.5 text-xs text-ink-muted">
									Sent to the client's registered mobile ending {last4}.
								</p>
								<div className="mt-3 flex justify-center">
									<InputOTP
										maxLength={4}
										value={otp}
										onChange={(val) => setOtp(val)}
									>
										<InputOTPGroup className="gap-2">
											{[0, 1, 2, 3].map((i) => (
												<InputOTPSlot
													key={i}
													index={i}
													className="size-12 rounded-lg border border-rule bg-paper text-lg tabular-nums text-ink-strong"
												/>
											))}
										</InputOTPGroup>
									</InputOTP>
								</div>
							</div>

							<div className="space-y-2.5">
								<Button
									onClick={handleAuthorize}
									className="h-11 w-full rounded-lg bg-stamp text-sm font-semibold text-stamp-foreground hover:bg-stamp-strong"
								>
									{failed ? "Authorise again" : "Authorise mandate"}
								</Button>
								<p className="text-center text-xs text-ink-faint">
									Registered over NPCI e-NACH. Cymbal Premier is a SEBI
									registered investment adviser, INA000012345.
								</p>
							</div>
						</>
					) : (
						<>
							<div className="flex items-center justify-between border-t border-rule pt-5">
								<span className="stamp-mark">e-NACH registered</span>
								<p className="text-xs text-ink-muted">
									Live from the 5th of next month
								</p>
							</div>

							<div className="paper-sunken flex items-end justify-between px-5 py-4">
								<div>
									<p className="label">Authorised monthly debit</p>
									<p className="figure-lg mt-2 tabular-nums">
										{inr(monthlyDebit)}
									</p>
								</div>
								<span className="figure-unit pb-2">per month</span>
							</div>

							<div className="grid grid-cols-2 gap-x-6 gap-y-4">
								<Field label="Transaction reference" value={txnId} mono />
								<Field label="Mandate reference" value={`UMRN ${UMRN}`} mono />
								<Field
									label="Debit account"
									value={`${bank} · XXXX ${last4}`}
								/>
								<Field label="Frequency" value="Monthly, 5th of each month" />
							</div>

							<DebitSchedule heading="Registered debits" lines={debits} />

							<Button
								variant="outline"
								onClick={handleClose}
								className="h-11 w-full rounded-lg text-sm font-semibold"
							>
								Close
							</Button>
						</>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
