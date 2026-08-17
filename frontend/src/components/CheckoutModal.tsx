import { useState } from "react";
import {
	CheckCircle2,
	ShieldCheck,
	Lock,
	ArrowRight,
	Building,
	Check,
	X,
	FileText,
} from "lucide-react";
import { useStore } from "../store";
import { sendAction } from "../ws";

export default function CheckoutModal() {
	const {
		mandateModalOpen,
		mandateStatus,
		basket,
		totalSip,
		totalLumpsum,
		portfolio,
		lastTransactionId,
		set,
		pushToast,
	} = useStore();

	const [otp, setOtp] = useState("7701");
	const [agreed, setAgreed] = useState(true);

	if (!mandateModalOpen) return null;

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
		<div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
			<div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
				{/* Header */}
				<div className="p-5 border-b border-slate-100 bg-[#0B2545] text-white flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="h-9 w-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
							<ShieldCheck size={20} />
						</div>
						<div>
							<h3 className="text-sm font-bold">
								{isSuccess
									? "Mandate Successfully Executed"
									: "e-NACH Mandate Authorization"}
							</h3>
							<p className="text-[11px] text-slate-300">
								{isSuccess
									? "Transaction Authorized & Live"
									: "Bank Auto-Debit & Risk Consent"}
							</p>
						</div>
					</div>
					<button
						onClick={handleClose}
						className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
					>
						<X size={16} />
					</button>
				</div>

				{/* Content */}
				<div className="p-6 space-y-5">
					{!isSuccess ? (
						<>
							{/* Bank Account Details */}
							<div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Building size={16} className="text-[#0B2545]" />
										<span className="font-bold text-slate-800">
											{portfolio?.bank_account?.bank || "Cymbal Premier Bank"}
										</span>
									</div>
									<span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
										Verified Tier 1
									</span>
								</div>
								<div className="flex justify-between text-slate-500 text-[11px]">
									<span>Account Number:</span>
									<span className="font-mono font-bold text-slate-700">
										•••• •••• ••••{" "}
										{portfolio?.bank_account?.account_number_last4 || "8821"}
									</span>
								</div>
								<div className="flex justify-between text-slate-500 text-[11px]">
									<span>Monthly Auto-Debit Mandate:</span>
									<span className="font-extrabold text-emerald-700">
										₹{totalSip.toLocaleString()} / month
									</span>
								</div>
							</div>

							{/* Mandate Items */}
							<div className="space-y-1.5">
								<p className="text-xs font-bold text-slate-700">
									Executing Allocations ({basket.length} Funds):
								</p>
								<div className="space-y-1 max-h-32 overflow-y-auto pr-1">
									{basket.map((b) => (
										<div
											key={b.product_id}
											className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs"
										>
											<span className="font-medium text-slate-800 truncate max-w-[240px]">
												{b.name}
											</span>
											<span className="font-bold text-emerald-700 whitespace-nowrap">
												{b.monthly_sip_inr
													? `₹${(b.monthly_sip_inr / 1000).toFixed(0)}k/mo`
													: `₹${(b.lumpsum_inr / 1000).toFixed(0)}k`}
											</span>
										</div>
									))}
								</div>
							</div>

							{/* SEBI Statutory Checkbox */}
							<div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80">
								<input
									type="checkbox"
									id="sebi-consent"
									checked={agreed}
									onChange={(e) => setAgreed(e.target.checked)}
									className="mt-0.5 accent-[#0B2545]"
								/>
								<label
									htmlFor="sebi-consent"
									className="text-[11px] text-amber-900 leading-tight cursor-pointer"
								>
									I authorize Cymbal Premier to set up an e-NACH mandate and
									debit my bank account. I acknowledge that mutual fund
									investments are subject to market risks.
								</label>
							</div>

							{/* OTP Input */}
							<div className="space-y-1.5">
								<div className="flex justify-between items-center">
									<label className="text-xs font-bold text-slate-700">
										Enter 4-Digit Authorization OTP:
									</label>
									<span className="text-[10px] text-slate-400 font-mono">
										Demo OTP: 7701
									</span>
								</div>
								<input
									type="text"
									maxLength={4}
									value={otp}
									onChange={(e) => setOtp(e.target.value)}
									placeholder="7701"
									className="w-full text-center tracking-[0.5em] font-mono text-xl py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B2545]/20 focus:border-[#0B2545] font-black text-slate-900"
								/>
							</div>

							<button
								onClick={handleAuthorize}
								className="w-full py-3 px-4 rounded-xl bg-[#0B2545] hover:bg-[#134074] text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md"
							>
								<Lock size={14} />
								<span>Confirm & Authorize e-NACH Mandate</span>
							</button>
						</>
					) : (
						<div className="text-center py-4 space-y-4">
							<div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
								<CheckCircle2 size={36} />
							</div>
							<div>
								<h4 className="text-base font-bold text-slate-900">
									Mandate Active & Executed
								</h4>
								<p className="text-xs text-slate-500 mt-1">
									Transaction ID:{" "}
									<span className="font-mono font-bold text-slate-800">
										{lastTransactionId}
									</span>
								</p>
								<p className="text-xs text-emerald-700 font-semibold mt-0.5">
									e-NACH auto-debit registered for ₹{totalSip.toLocaleString()}{" "}
									/ month.
								</p>
							</div>

							<div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-left text-slate-600">
								<p className="font-bold text-slate-800 mb-1">
									Execution Status:
								</p>
								<p>
									• ₹35k / mo → Cymbal Flexi Cap Opportunities Fund (SIP Active)
								</p>
								<p>
									• ₹25k / mo → Cymbal Multi-Asset Strategy Fund (SIP Active)
								</p>
								<p>• ₹20k / mo → Cymbal CRISIL SDL 2030 Fund (SIP Active)</p>
								<p>• ₹20k / mo → Cymbal US & Global Tech Feeder (SIP Active)</p>
							</div>

							<button
								onClick={handleClose}
								className="w-full py-2.5 px-4 rounded-xl bg-[#0B2545] hover:bg-[#134074] text-white font-bold text-xs transition"
							>
								Close & Return to Studio
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
