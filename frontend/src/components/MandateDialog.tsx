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
			<DialogContent className="max-w-lg p-0 overflow-hidden bg-[#0A111E] border border-white/15 text-slate-200 shadow-2xl rounded-2xl">
				{/* Header */}
				<DialogHeader className="p-5 bg-slate-950/90 border-b border-white/10 text-white">
					<div className="flex items-center gap-3">
						<div className="size-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-xs">
							<ShieldCheck className="size-5" />
						</div>
						<div>
							<DialogTitle className="text-white text-base">
								{isSuccess
									? "Mandate Successfully Executed"
									: "e-NACH Mandate Authorization"}
							</DialogTitle>
							<DialogDescription className="text-slate-400 text-xs">
								{isSuccess
									? "Transaction Authorized & Live"
									: "Bank Auto-Debit & Statutory Risk Consent"}
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				{/* Content */}
				<div className="p-6 space-y-5">
					{!isSuccess ? (
						<>
							{/* Bank Account Details */}
							<div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2 text-xs">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Building className="size-4 text-amber-400" />
										<span className="font-bold text-white">
											{portfolio?.bank_account?.bank || "Cymbal Premier Private Bank"}
										</span>
									</div>
									<span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
										Verified Tier 1
									</span>
								</div>
								<div className="flex justify-between text-slate-400 text-[11px]">
									<span>Account Number:</span>
									<span className="font-mono font-bold text-slate-200">
										•••• •••• ••••{" "}
										{portfolio?.bank_account?.account_number_last4 || "8821"}
									</span>
								</div>
								<div className="flex justify-between text-slate-400 text-[11px]">
									<span>Monthly Auto-Debit Mandate:</span>
									<span className="font-mono font-black text-emerald-400 text-xs">
										₹{totalSip.toLocaleString()} / month
									</span>
								</div>
							</div>

							{/* Mandate Items */}
							<div className="space-y-1.5">
								<p className="text-xs font-bold uppercase tracking-wider text-slate-300">
									Executing Allocations ({basket.length} Instruments):
								</p>
								<div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
									{basket.map((b) => (
										<div
											key={b.product_id}
											className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/50 border border-white/5 text-xs"
										>
											<span className="font-medium text-slate-200 truncate max-w-[240px]">
												{b.name}
											</span>
											<span className="font-mono font-bold text-emerald-400 whitespace-nowrap">
												{b.monthly_sip_inr
													? `₹${(b.monthly_sip_inr / 1000).toFixed(0)}k/mo`
													: `₹${(b.lumpsum_inr / 1000).toFixed(0)}k`}
											</span>
										</div>
									))}
								</div>
							</div>

							{/* SEBI Statutory Checkbox */}
							<div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-950/20 border border-amber-400/25">
								<Checkbox
									id="sebi-consent"
									checked={agreed}
									onCheckedChange={(checked) => setAgreed(!!checked)}
									className="mt-0.5 border-amber-400/50 data-[state=checked]:bg-amber-400 data-[state=checked]:text-slate-950"
								/>
								<Label
									htmlFor="sebi-consent"
									className="text-[11px] text-amber-200/90 leading-snug cursor-pointer font-normal"
								>
									I authorize Cymbal Premier to establish an e-NACH auto-debit mandate on my registered bank account. I acknowledge mutual fund market risks as mandated by SEBI guidelines.
								</Label>
							</div>

							{/* OTP Input */}
							<div className="space-y-2">
								<div className="flex justify-between items-center">
									<Label className="text-xs font-bold text-slate-200">
										Enter 4-Digit Authorization OTP:
									</Label>
									<span className="text-[10px] text-amber-400 font-mono bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
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
											<InputOTPSlot index={0} className="bg-slate-950 border-white/20 text-white font-mono font-bold size-11" />
											<InputOTPSlot index={1} className="bg-slate-950 border-white/20 text-white font-mono font-bold size-11" />
											<InputOTPSlot index={2} className="bg-slate-950 border-white/20 text-white font-mono font-bold size-11" />
											<InputOTPSlot index={3} className="bg-slate-950 border-white/20 text-white font-mono font-bold size-11" />
										</InputOTPGroup>
									</InputOTP>
								</div>
							</div>

							<Button
								onClick={handleAuthorize}
								className="w-full h-11 font-bold text-xs gap-2 bg-amber-400 text-slate-950 hover:bg-amber-300 rounded-xl shadow-xs"
							>
								<Lock className="size-4" />
								<span>Confirm & Authorize e-NACH Mandate</span>
							</Button>
						</>
					) : (
						<div className="text-center py-4 space-y-4">
							<div className="size-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
								<CheckCircle2 className="size-9" />
							</div>
							<div>
								<h4 className="text-base font-bold text-white">
									Mandate Active & Executed
								</h4>
								<p className="text-xs text-slate-400 mt-1">
									Transaction Reference:{" "}
									<span className="font-mono font-bold text-amber-300">
										{lastTransactionId}
									</span>
								</p>
								<p className="text-xs text-emerald-400 font-semibold mt-0.5">
									e-NACH auto-debit registered for ₹{totalSip.toLocaleString()} / month.
								</p>
							</div>

							<div className="p-3.5 bg-slate-950/70 rounded-xl border border-white/10 text-xs text-left text-slate-300 space-y-1">
								<p className="font-bold text-white mb-1">
									Allocations Live:
								</p>
								<p>• ₹35k / mo → Cymbal Flexi Cap Opportunities Fund (SIP Active)</p>
								<p>• ₹25k / mo → Cymbal Multi-Asset Strategy Fund (SIP Active)</p>
								<p>• ₹20k / mo → Cymbal CRISIL SDL 2030 Fund (SIP Active)</p>
								<p>• ₹20k / mo → Cymbal US & Global Tech Feeder (SIP Active)</p>
							</div>

							<Button
								onClick={handleClose}
								className="w-full h-10 font-bold text-xs bg-amber-400 text-slate-950 hover:bg-amber-300 rounded-xl"
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

