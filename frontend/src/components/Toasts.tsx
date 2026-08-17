import { Check } from "lucide-react";
import { useStore } from "../store";

export default function Toasts() {
	const toasts = useStore((s) => s.toasts);
	return (
		<div
			className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center gap-2"
			aria-live="polite"
		>
			{toasts.map((t) => (
				<div
					key={t.id}
					className="glass rounded-full pl-3 pr-4 py-2 shadow-lift flex items-center gap-2 animate-fade-up"
				>
					<span className="grid place-items-center h-5 w-5 rounded-full bg-brand-gradient text-white">
						<Check size={13} />
					</span>
					<span className="text-sm font-medium text-brand-ink">{t.text}</span>
				</div>
			))}
		</div>
	);
}
