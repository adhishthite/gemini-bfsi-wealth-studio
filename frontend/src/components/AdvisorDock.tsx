import { useEffect, useRef, useState } from "react";
import {
	Mic,
	Send,
	Volume2,
	VolumeX,
	Video,
	PhoneOff,
	Maximize2,
	Minimize2,
} from "lucide-react";
import { useStore } from "@/store";
import { sendUserText } from "@/ws";
import { inrCompact, rupee } from "@/lib";
import { LiveAvatar } from "@/lib/liveClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/* Seeded openings for the advisory conversation. Amounts run through the
   Indian grouping helpers so the chips and the transcript agree. */
const ADVISORY_OPENERS = [
	`Review my ${inrCompact(7500000)} portfolio and goal progress`,
	"Show the top flexi cap and global tech funds",
	"Add all-weather volatility protection",
	`Simulate a ${rupee(100000)} monthly SIP for the 2042 retirement goal`,
	"Generate the official advisory proposal",
];

const CLIENT_NAME = "Rahul Sharma";

/**
 * Audio level indicator, demoted to chrome.
 *
 * Three hairlines that breathe in opacity — no bouncing, no glow, no layout
 * movement. It only renders while Ananya is genuinely listening, thinking or
 * speaking, so an idle dock on a projected screen holds perfectly still.
 */
function AudioLevel({ active }: { active: boolean }) {
	if (!active) return null;
	return (
		<span className="inline-flex h-3 items-end gap-[3px]" aria-hidden="true">
			{[7, 11, 8].map((h, i) => (
				<span
					key={i}
					className="w-[2px] animate-pulse bg-ink-muted"
					style={{
						height: `${h}px`,
						animationDelay: `${i * 200}ms`,
						animationDuration: "1.8s",
					}}
				/>
			))}
		</span>
	);
}

export default function AdvisorDock() {
	const {
		chat,
		thinking,
		speaking,
		listening,
		voiceOn,
		connected,
		live,
		expandedAdvisor,
		set,
	} = useStore();
	const [text, setText] = useState("");
	const scrollRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const captionRef = useRef<HTMLParagraphElement>(null);
	const liveRef = useRef<LiveAvatar | null>(null);

	useEffect(() => {
		scrollRef.current?.scrollTo({
			top: scrollRef.current.scrollHeight,
			behavior: "smooth",
		});
	}, [chat, thinking]);

	useEffect(() => {
		const el = captionRef.current;
		if (el) el.scrollTop = el.scrollHeight;
	}, [live.caption]);

	const startLive = async () => {
		if (!canvasRef.current || live.active) return;
		set({ voiceOn: false });
		liveRef.current = new LiveAvatar(canvasRef.current);
		try {
			await liveRef.current.start(useStore.getState().selectedAvatar);
		} catch {
			useStore
				.getState()
				.pushToast(
					"Couldn't start the live advisor (mic permission?)",
					"warning",
				);
		}
	};

	const stopLive = () => {
		liveRef.current?.stop();
		liveRef.current = null;
	};

	useEffect(() => () => liveRef.current?.stop(), []);

	const talk = (on: boolean) => liveRef.current?.setTalking(on);

	useEffect(() => {
		if (!live.active) return;
		const down = (e: KeyboardEvent) => {
			if (
				e.code === "Space" &&
				!e.repeat &&
				document.activeElement?.tagName !== "TEXTAREA" &&
				document.activeElement?.tagName !== "INPUT"
			) {
				e.preventDefault();
				talk(true);
			}
		};
		const up = (e: KeyboardEvent) => {
			if (e.code === "Space") {
				e.preventDefault();
				talk(false);
			}
		};
		window.addEventListener("keydown", down);
		window.addEventListener("keyup", up);
		return () => {
			window.removeEventListener("keydown", down);
			window.removeEventListener("keyup", up);
		};
	}, [live.active]);

	const submit = () => {
		const t = text.trim();
		if (!t) return;
		if (live.active) {
			liveRef.current?.sendText(t);
			useStore.getState().pushChat({ role: "user", text: t });
		} else {
			sendUserText(t);
		}
		setText("");
	};

	const status = live.active
		? live.status === "connecting"
			? "Connecting"
			: live.status === "speaking"
				? "Speaking"
				: "Listening"
		: !connected
			? "Connecting"
			: thinking
				? "Reviewing the portfolio"
				: listening
					? "Listening"
					: speaking
						? "Speaking"
						: "Available";

	/* Consecutive messages from the same speaker are one minuted turn: one
	   attribution, one rule, several paragraphs. */
	const turns: { role: string; items: typeof chat }[] = [];
	for (const m of chat) {
		const last = turns[turns.length - 1];
		if (last && last.role === m.role) last.items.push(m);
		else turns.push({ role: m.role, items: [m] });
	}

	return (
		<div className="paper flex h-full flex-col overflow-hidden">
			{/* ===== LIVE STAGE ===== */}
			<div
				className={
					live.active
						? "relative min-h-0 flex-1 overflow-hidden bg-black"
						: "hidden"
				}
			>
				<canvas
					ref={canvasRef}
					className="absolute inset-0 h-full w-full origin-bottom scale-[1.08] object-cover object-center"
				/>

				{/* Live marker + the one control that matters on stage */}
				<div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 px-4 py-3">
					<span className="border-l-2 border-white bg-black/70 px-2.5 py-1 text-[0.75rem] font-medium uppercase leading-4 tracking-[0.09em] text-white">
						Live · Senior Relationship Manager
					</span>
					<button
						type="button"
						onClick={stopLive}
						className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/30 bg-black/70 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-black"
					>
						<PhoneOff className="size-4" />
						<span>End live</span>
					</button>
				</div>

				{/* Spoken transcript, sized to read from across the room */}
				<div className="absolute inset-x-0 bottom-19 z-10 border-t border-white/20 bg-black/75 px-4 py-3">
					<p
						ref={captionRef}
						className="scrollbar-none max-h-24 overflow-y-auto text-base leading-relaxed text-white"
					>
						{live.caption ||
							"Hold the spacebar, or the talk button, to speak with Ananya."}
					</p>
				</div>

				{/* Push to talk */}
				<div className="absolute inset-x-0 bottom-4 z-10 flex justify-center">
					<button
						type="button"
						onMouseDown={() => talk(true)}
						onMouseUp={() => talk(false)}
						onTouchStart={() => talk(true)}
						onTouchEnd={() => talk(false)}
						className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-semibold transition-colors ${
							live.talking
								? "bg-stamp text-stamp-foreground"
								: "bg-white text-ink-strong hover:bg-white/90"
						}`}
					>
						<Mic className="size-4" />
						<span>
							{live.talking ? "Release to send" : "Hold to talk — or spacebar"}
						</span>
					</button>
				</div>
			</div>

			{/* ===== HEADER: name, status, one action ===== */}
			{!live.active && (
				<header className="flex items-start justify-between gap-4 border-b border-rule bg-paper-sheet px-5 py-4">
					<div className="flex min-w-0 items-start gap-3">
						<div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-rule bg-paper-sunken">
							<span className="font-display text-lg leading-none text-ink-strong">
								A
							</span>
						</div>
						<div className="min-w-0">
							<h2 className="doc-title text-lg leading-tight">Ananya</h2>
							<p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
								<span>Senior Relationship Manager</span>
								<span className="h-3 w-px bg-rule" aria-hidden="true" />
								<span className="inline-flex items-center gap-1.5">
									<span
										className={`size-1.5 rounded-full ${
											connected ? "bg-ink-strong" : "bg-ink-faint"
										}`}
										aria-hidden="true"
									/>
									<span>{status}</span>
								</span>
								<AudioLevel active={listening || speaking || thinking} />
							</p>
						</div>
					</div>

					<div className="flex shrink-0 items-center gap-1">
						{/* Quiet chrome: stage size and voice. Both stay live for the demo. */}
						<button
							type="button"
							onClick={() => set({ expandedAdvisor: !expandedAdvisor })}
							title={
								expandedAdvisor ? "Collapse the advisor" : "Expand the advisor"
							}
							aria-label={
								expandedAdvisor ? "Collapse the advisor" : "Expand the advisor"
							}
							className="inline-flex size-8 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-paper-sunken hover:text-ink-strong focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-rule-strong"
						>
							{expandedAdvisor ? (
								<Minimize2 className="size-4" />
							) : (
								<Maximize2 className="size-4" />
							)}
						</button>
						<button
							type="button"
							onClick={() => set({ voiceOn: !voiceOn })}
							title={voiceOn ? "Mute Ananya" : "Unmute Ananya"}
							aria-label={voiceOn ? "Mute Ananya" : "Unmute Ananya"}
							className="inline-flex size-8 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-paper-sunken hover:text-ink-strong focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-rule-strong"
						>
							{voiceOn ? (
								<Volume2 className="size-4" />
							) : (
								<VolumeX className="size-4" />
							)}
						</button>

						{/* The single accent on this screen: the moment the demo turns on. */}
						<Button
							onClick={startLive}
							title="Start the live video advisor"
							className="ml-1.5 h-9 gap-2 rounded-lg bg-stamp px-4 text-xs font-semibold text-stamp-foreground shadow-none hover:bg-stamp-strong"
						>
							<Video className="size-4" />
							<span>Go live</span>
						</Button>
					</div>
				</header>
			)}

			{/* ===== TRANSCRIPT ===== */}
			{!live.active && (
				<div
					ref={scrollRef}
					className="min-h-0 flex-1 overflow-y-auto bg-paper px-5 py-5"
				>
					<ol className="space-y-6">
						{turns.map((turn, ti) => {
							const isClient = turn.role === "user";
							return (
								<li
									key={turn.items[0].id ?? ti}
									className={isClient ? "pl-8" : "mark-quiet"}
								>
									<p className={`mb-1.5 ${isClient ? "label" : "label-strong"}`}>
										{isClient ? CLIENT_NAME : "Ananya"}
									</p>
									<div className="space-y-2.5">
										{turn.items.map((m) => (
											<p
												key={m.id}
												className={`text-base leading-relaxed ${
													isClient
														? "font-medium text-ink-strong"
														: "text-ink"
												}`}
											>
												{m.text}
											</p>
										))}
									</div>
								</li>
							);
						})}

						{thinking && (
							<li className="mark-quiet">
								<p className="label-strong mb-1.5">Ananya</p>
								<p className="text-base leading-relaxed text-ink-faint">
									Reviewing your allocation and goal funding…
								</p>
							</li>
						)}
					</ol>

					{chat.length <= 2 && !thinking && (
						<div className="mt-8 border-t border-rule pt-5">
							<p className="label">Suggested</p>
							<div className="mt-3 grid gap-2">
								{ADVISORY_OPENERS.slice(0, 3).map((s) => (
									<button
										key={s}
										type="button"
										onClick={() => sendUserText(s)}
										className="paper-interactive px-3.5 py-2.5 text-left text-xs text-ink"
									>
										{s}
									</button>
								))}
							</div>
						</div>
					)}
				</div>
			)}

			{/* ===== COMPOSER ===== */}
			{!live.active && (
				<div className="border-t border-rule bg-paper-sheet px-5 py-4">
					<form
						onSubmit={(e) => {
							e.preventDefault();
							submit();
						}}
						className="flex items-center gap-2"
					>
						<Input
							type="text"
							value={text}
							onChange={(e) => setText(e.target.value)}
							placeholder="Ask Ananya about the portfolio, the goals or the mandate"
							className="paper-sunken h-10 flex-1 rounded-lg border-rule text-sm text-ink placeholder:text-ink-faint focus-visible:ring-1 focus-visible:ring-rule-strong focus-visible:ring-offset-0"
						/>
						<Button
							type="submit"
							disabled={!text.trim()}
							size="icon"
							aria-label="Send"
							className="size-10 shrink-0 rounded-lg shadow-none"
						>
							<Send className="size-4" />
						</Button>
					</form>
				</div>
			)}
		</div>
	);
}
