import { useState } from "react";
import {
	CheckCircle2,
	ShieldCheck,
	Lock,
	Building,
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@/components/ui/input-otp";

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

	const [otp, setOtp] = useState("7701");
	const [agreed, setAgreed] = useState(true);

	const handleAuthorize = () => {
		if (!agreed) {
			pushToast("Please accept the SEBI statutory declaration", "warning");
			return;
		}
		sendAction("execute_mandate", { otp });
	};

	const handleClose = () => {
		set({ mandateModalOpen: false });
	};

	const isSuccess = mandateStatus === "authorized";

	return (
		<Dialog
			open={mandateModalOpen}
			onOpenChange={(open) => set({ mandateModalOpen: open })}
		>
			<DialogContent className="max-w-lg p-0 overflow-hidden">
				{/* Header */}
				<DialogHeader className="p-5 bg-gradient-to-r from-slate-900 to-[#0B2545] text-white">
					<div className="flex items-center gap-3">
						<div className="size-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
							<ShieldCheck className="size-5" />
						</div>
						<div>
							<DialogTitle className="text-white text-base">
								{isSuccess
									? "Mandate Successfully Executed"
									: "e-NACH Mandate Authorization"}
							</DialogTitle>
							<DialogDescription className="text-slate-300">
								{isSuccess
									? "Transaction Authorized & Live"
									: "Bank Auto-Debit & Risk Consent"}
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				{/* Content */}
				<div className="p-6 space-y-5">
					{!isSuccess ? (
						<>
							{/* Bank Account Details */}
							<div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-2 text-xs">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Building className="size-4 text-primary" />
										<span className="font-bold text-foreground">
											{portfolio?.bank_account?.bank || "Cymbal Premier Bank"}
										</span>
									</div>
									<Badge variant="debt" className="text-[10px]">
										Verified Tier 1
									</Badge>
								</div>
								<div className="flex justify-between text-muted-foreground text-[11px]">
									<span>Account Number:</span>
									<span className="font-mono font-bold text-foreground">
										•••• •••• ••••{" "}
										{portfolio?.bank_account?.account_number_last4 || "8821"}
									</span>
								</div>
								<div className="flex justify-between text-muted-foreground text-[11px]">
									<span>Monthly Auto-Debit Mandate:</span>
									<span className="font-extrabold text-emerald-700 dark:text-emerald-400">
										₹{totalSip.toLocaleString()} / month
									</span>
								</div>
							</div>

							{/* Mandate Items */}
							<div className="space-y-1.5">
								<p className="text-xs font-bold text-foreground">
									Executing Allocations ({basket.length} Funds):
								</p>
								<div className="space-y-1 max-h-32 overflow-y-auto pr-1">
									{basket.map((b) => (
										<div
											key={b.product_id}
											className="flex items-center justify-between p-2 rounded-xl bg-muted/30 border border-border text-xs"
										>
											<span className="font-medium text-foreground truncate max-w-[240px]">
												{b.name}
											</span>
											<span className="font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
												{b.monthly_sip_inr
													? `₹${(b.monthly_sip_inr / 1000).toFixed(0)}k/mo`
													: `₹${(b.lumpsum_inr / 1000).toFixed(0)}k`}
											</span>
										</div>
									))}
								</div>
							</div>

							{/* SEBI Statutory Checkbox with ShadCN Checkbox + Label */}
							<div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 dark:bg-amber-950/20 dark:border-amber-900/30">
								<Checkbox
									id="sebi-consent"
									checked={agreed}
									onCheckedChange={(checked) => setAgreed(!!checked)}
									className="mt-0.5"
								/>
								<Label
									htmlFor="sebi-consent"
									className="text-[11px] text-amber-900 dark:text-amber-200 leading-snug cursor-pointer font-normal"
								>
									I authorize Cymbal Premier to set up an e-NACH mandate and
									debit my bank account. I acknowledge that mutual fund
									investments are subject to market risks.
								</Label>
							</div>

							{/* OTP Input with ShadCN InputOTP */}
							<div className="space-y-2">
								<div className="flex justify-between items-center">
									<Label className="text-xs font-bold text-foreground">
										Enter 4-Digit Authorization OTP:
									</Label>
									<span className="text-[10px] text-muted-foreground font-mono">
										Demo OTP: 7701
									</span>
								</div>
								<div className="flex justify-center py-1">
									<InputOTP
										maxLength={4}
										value={otp}
										onChange={(val) => setOtp(val)}
									>
										<InputOTPGroup className="gap-2">
											<InputOTPSlot index={0} />
											<InputOTPSlot index={1} />
											<InputOTPSlot index={2} />
											<InputOTPSlot index={3} />
										</InputOTPGroup>
									</InputOTP>
								</div>
							</div>

							<Button
								onClick={handleAuthorize}
								variant="wealth"
								className="w-full h-11 font-bold text-xs gap-2 shadow-md"
							>
								<Lock className="size-4" />
								<span>Confirm & Authorize e-NACH Mandate</span>
							</Button>
						</>
					) : (
						<div className="text-center py-4 space-y-4">
							<div className="size-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
								<CheckCircle2 className="size-9" />
							</div>
							<div>
								<h4 className="text-base font-bold text-foreground">
									Mandate Active & Executed
								</h4>
								<p className="text-xs text-muted-foreground mt-1">
									Transaction ID:{" "}
									<span className="font-mono font-bold text-foreground">
										{lastTransactionId}
									</span>
								</p>
								<p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
									e-NACH auto-debit registered for ₹{totalSip.toLocaleString()} / month.
								</p>
							</div>

							<div className="p-3 bg-muted/40 rounded-xl border border-border text-xs text-left text-muted-foreground space-y-1">
								<p className="font-bold text-foreground mb-1">
									Execution Status:
								</p>
								<p>• ₹35k / mo → Cymbal Flexi Cap Opportunities Fund (SIP Active)</p>
								<p>• ₹25k / mo → Cymbal Multi-Asset Strategy Fund (SIP Active)</p>
								<p>• ₹20k / mo → Cymbal CRISIL SDL 2030 Fund (SIP Active)</p>
								<p>• ₹20k / mo → Cymbal US & Global Tech Feeder (SIP Active)</p>
							</div>

							<Button
								onClick={handleClose}
								variant="wealth"
								className="w-full h-10 font-bold text-xs"
							>
								Close & Return to Studio
							</Button>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
