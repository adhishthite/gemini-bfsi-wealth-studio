import { ShieldCheck, Sparkles } from "lucide-react";

export function PremierMark({
	size = 36,
	className = "",
}: {
	size?: number;
	className?: string;
}) {
	return (
		<div
			style={{ width: size, height: size }}
			className={`relative rounded-xl bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#0A0F1D] border border-amber-400/30 flex items-center justify-center text-white shadow-card-luxury select-none group overflow-hidden ${className}`}
		>
			{/* Ambient gold glow highlight */}
			<div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-400/10 to-amber-300/20 opacity-80" />
			<ShieldCheck size={size * 0.55} className="text-amber-400 relative z-10 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
		</div>
	);
}

export default function Logo({ compact = false }: { compact?: boolean }) {
	return (
		<div className="flex items-center gap-3 select-none">
			<PremierMark size={38} />
			{!compact && (
				<div className="leading-none">
					<div className="flex items-center gap-1.5">
						<span className="text-[17px] font-black tracking-tight text-slate-900 dark:text-white">
							CYMBAL
						</span>
						<span className="text-[17px] font-extrabold tracking-tight text-amber-700 dark:text-amber-400">
							PREMIER
						</span>
						<span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-400/15 text-amber-900 dark:text-amber-300 border border-amber-400/30">
							WEALTH
						</span>
					</div>
					<p className="text-[10px] uppercase font-bold tracking-[0.22em] text-slate-500 dark:text-slate-400 mt-1">
						Private Portfolio Advisory
					</p>
				</div>
			)}
		</div>
	);
}

