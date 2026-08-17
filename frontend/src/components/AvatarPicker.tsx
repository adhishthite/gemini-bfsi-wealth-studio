import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useStore } from "../store";
import { AVATARS, avatarImg } from "../lib";
import { selectAvatar } from "../ws";

// The avatar portrait IS the picker — click it to change stylist. Disabled while live.
export default function AvatarPicker() {
	const { selectedAvatar, connected, live } = useStore();
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const disabled = live.active;

	useEffect(() => {
		const onDoc = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node))
				setOpen(false);
		};
		document.addEventListener("mousedown", onDoc);
		return () => document.removeEventListener("mousedown", onDoc);
	}, []);

	return (
		<div className="relative" ref={ref}>
			<button
				onClick={() => !disabled && setOpen((v) => !v)}
				disabled={disabled}
				aria-label="Change stylist avatar"
				className="relative block rounded-full group"
			>
				<span className="block h-16 w-16 rounded-full p-[2px] bg-brand-gradient">
					<img
						src={avatarImg(selectedAvatar)}
						alt={selectedAvatar}
						className="h-full w-full rounded-full object-cover object-top bg-white"
					/>
				</span>
				<span
					className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${connected ? "bg-emerald-500" : "bg-stone-300"}`}
				/>
				{!disabled && (
					<span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 translate-y-1/2 grid place-items-center h-5 w-5 rounded-full bg-white border border-stone-200 shadow text-brand-purple opacity-90 group-hover:bg-brand-purple group-hover:text-white transition">
						<ChevronDown size={12} />
					</span>
				)}
			</button>

			{open && (
				<div className="absolute left-0 top-[72px] z-50 w-64 glass rounded-xl2 shadow-lift p-2.5 animate-scale-in">
					<p className="px-1.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
						Choose your stylist
					</p>
					<div className="grid grid-cols-3 gap-2">
						{AVATARS.map((name) => (
							<button
								key={name}
								onClick={() => {
									selectAvatar(name);
									setOpen(false);
								}}
								className={`relative rounded-xl p-1.5 flex flex-col items-center gap-1 transition
                  ${name === selectedAvatar ? "bg-violet-50 ring-1 ring-brand-purple/40" : "hover:bg-stone-50"}`}
							>
								<img
									src={avatarImg(name)}
									alt={name}
									className="h-16 w-16 rounded-lg object-cover"
								/>
								<span className="text-[11px] font-medium text-brand-ink">
									{name}
								</span>
								{name === selectedAvatar && (
									<span className="absolute top-1 right-1 grid place-items-center h-4 w-4 rounded-full bg-brand-gradient text-white">
										<Check size={10} />
									</span>
								)}
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
