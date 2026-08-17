/**
 * The mark is an attestation seal, not a logo lockup.
 *
 * A square rule with the house monogram set in Caslon — the way a private
 * bank marks a document rather than the way a SaaS product brands a nav bar.
 * No gradient, no glow, no shadow.
 */
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
			className={`relative flex select-none items-center justify-center rounded-sm border border-ink-strong bg-transparent ${className}`}
			aria-hidden="true"
		>
			<span
				className="font-display leading-none text-ink-strong"
				style={{ fontSize: size * 0.46 }}
			>
				CP
			</span>
		</div>
	);
}

export default function Logo({ compact = false }: { compact?: boolean }) {
	return (
		<div className="flex select-none items-center gap-3">
			<PremierMark size={36} />
			{!compact && (
				<div className="leading-none">
					<div className="font-display text-lg leading-none text-ink-strong">
						Cymbal Premier
					</div>
					<p className="label mt-1.5">Private Wealth &amp; Advisory</p>
				</div>
			)}
		</div>
	);
}
