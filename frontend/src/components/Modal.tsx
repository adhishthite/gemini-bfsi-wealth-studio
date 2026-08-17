import { X } from "lucide-react";
import type { ReactNode } from "react";

export default function Modal({
	open,
	onClose,
	children,
	title,
	maxW = "max-w-lg",
	dismissable = true,
}: {
	open: boolean;
	onClose: () => void;
	children: ReactNode;
	title?: string;
	maxW?: string;
	dismissable?: boolean;
}) {
	if (!open) return null;
	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
			<div
				className="absolute inset-0 bg-brand-ink/45 backdrop-blur-sm animate-[fade-up_.2s_ease-out]"
				onClick={dismissable ? onClose : undefined}
			/>
			<div
				className={`relative w-full ${maxW} glass rounded-xl2 shadow-lift animate-scale-in overflow-hidden`}
			>
				{(title || dismissable) && (
					<div className="flex items-center justify-between px-6 pt-5 pb-3">
						<h3 className="text-lg font-semibold text-brand-ink">{title}</h3>
						{dismissable && (
							<button
								onClick={onClose}
								aria-label="Close"
								className="rounded-full p-1.5 text-brand-ink/50 hover:bg-brand-ink/5 hover:text-brand-ink transition"
							>
								<X size={18} />
							</button>
						)}
					</div>
				)}
				{children}
			</div>
		</div>
	);
}
