import { ShieldCheck } from "lucide-react";

export function PremierMark({
	size = 32,
	className = "",
}: {
	size?: number;
	className?: string;
}) {
	return (
		<div
			style={{ width: size, height: size }}
			className={`rounded-xl bg-gradient-to-tr from-[#0B2545] via-[#134074] to-[#B8860B] flex items-center justify-center text-white shadow-md select-none ${className}`}
		>
			<ShieldCheck size={size * 0.6} className="text-amber-300" />
		</div>
	);
}

export default function Logo({ compact = false }: { compact?: boolean }) {
	return (
		<div className="flex items-center gap-3 select-none">
			<PremierMark size={36} />
			{!compact && (
				<div className="leading-none">
					<div className="flex items-center gap-1.5">
						<span className="text-[17px] font-black tracking-tight text-foreground">
							CYMBAL
						</span>
						<span className="text-[17px] font-extrabold tracking-tight text-amber-700 dark:text-amber-400">
							PREMIER
						</span>
					</div>
					<p className="text-[10px] uppercase font-bold tracking-[0.20em] text-muted-foreground mt-1">
						Private Wealth Studio
					</p>
				</div>
			)}
		</div>
	);
}
