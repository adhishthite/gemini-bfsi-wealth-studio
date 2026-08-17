import { useEffect, useRef, useState } from "react";
import {
	Mic,
	Send,
	Volume2,
	VolumeX,
	Sparkles,
	Video,
	PhoneOff,
	ShieldCheck,
	Maximize2,
	Minimize2,
	Activity,
} from "lucide-react";
import { useStore } from "@/store";
import { sendUserText } from "@/ws";
import { LiveAvatar } from "@/lib/liveClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const WEALTH_STARTERS = [
	"Review my ₹75L portfolio & goal progress",
	"Show top Flexi Cap & Global Tech funds",
	"Add all-weather volatility protection",
	"Simulate ₹1 Lakh/month SIP for 2042 Retirement",
	"Generate official Advisory Proposal PDF",
];

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
					"Couldn't start the live avatar (mic permission?)",
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
			? "Connecting Live…"
			: live.status === "speaking"
				? "Ananya Speaking…"
				: "Listening…"
		: !connected
			? "Connecting…"
			: thinking
				? "Analyzing Allocations…"
				: listening
					? "Listening…"
					: speaking
						? "Ananya Speaking…"
						: "Senior Advisory Online";

	return (
		<div className="glass-panel rounded-2xl flex flex-col h-full overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-card-luxury">
			{/* ===== LIVE VIDEO STAGE (Gemini 3.1 Live Avatar) ===== */}
			<div
				className={
					live.active
						? "relative flex-1 min-h-0 bg-slate-950 overflow-hidden"
						: "hidden"
				}
			>
				<canvas
					ref={canvasRef}
					className="absolute inset-0 h-full w-full object-cover object-center scale-[1.08] origin-bottom"
				/>

				{/* Live Status Overlay */}
				<div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
					<div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-semibold border border-white/10">
						<span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
						<span>Photoreal Live Advisor</span>
					</div>
					<Button
						size="sm"
						variant="destructive"
						onClick={stopLive}
						className="h-7 px-2.5 rounded-full text-xs font-bold gap-1 shadow-lg"
					>
						<PhoneOff className="size-3.5" />
						<span>End Live</span>
					</Button>
				</div>

				{/* Live Subtitle Transcript */}
				<div className="absolute bottom-16 left-3 right-3 bg-slate-950/85 backdrop-blur-md rounded-xl p-3 z-10 border border-white/10 shadow-2xl">
					<p
						ref={captionRef}
						className="text-xs text-white leading-relaxed max-h-20 overflow-y-auto font-medium"
					>
						{live.caption ||
							"Hold Spacebar or the Mic button to converse with Ananya..."}
					</p>
				</div>

				{/* Push-to-Talk Floating Bar */}
				<div className="absolute bottom-3 left-0 right-0 flex justify-center z-10">
					<Button
						onMouseDown={() => talk(true)}
						onMouseUp={() => talk(false)}
						onTouchStart={() => talk(true)}
						onTouchEnd={() => talk(false)}
						variant={live.talking ? "destructive" : "default"}
						className={`rounded-full px-5 py-2 font-bold text-xs shadow-lg transition-transform ${
							live.talking
								? "scale-105"
								: "bg-amber-400 text-slate-950 hover:bg-amber-300"
						}`}
					>
						<Mic className={`size-3.5 ${live.talking ? "animate-pulse" : ""}`} />
						<span>
							{live.talking ? "Release to Send" : "Hold to Talk (or Spacebar)"}
						</span>
					</Button>
				</div>
			</div>

			{/* ===== STANDARD ADVISOR HEADER ===== */}
			{!live.active && (
				<div className="p-3.5 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/70 text-slate-900 dark:text-white flex items-center justify-between">
					<div className="flex items-center gap-2.5">
						<div className="relative">
							<Avatar className="size-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-md border border-amber-400/40">
								<AvatarFallback className="rounded-xl bg-transparent text-slate-950 font-black text-sm">
									A
								</AvatarFallback>
							</Avatar>
							<span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950 shadow-xs" />
						</div>
						<div>
							<div className="flex items-center gap-1.5">
								<h3 className="font-bold text-sm leading-none text-slate-900 dark:text-white">Ananya</h3>
								<span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-400/15 text-amber-900 dark:text-amber-300 border border-amber-400/30">
									Senior RM
								</span>
							</div>
							<p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
								<ShieldCheck className="size-3 text-emerald-600 dark:text-emerald-400" />
								<span>{status}</span>
							</p>
						</div>
					</div>

					<div className="flex items-center gap-1.5">
						{/* Audio Pulse Visualizer */}
						{(speaking || thinking) && (
							<div className="flex items-center gap-0.5 px-2 py-1 bg-amber-400/10 rounded-lg border border-amber-400/25 mr-1">
								<span className="size-1 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
								<span className="size-1 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
								<span className="size-1 bg-amber-400 rounded-full animate-bounce" />
							</div>
						)}

						{/* Expand Toggle */}
						<Button
							variant="ghost"
							size="iconSm"
							onClick={() => set({ expandedAdvisor: !expandedAdvisor })}
							className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 size-7 rounded-lg hidden xl:flex"
							title={expandedAdvisor ? "Collapse Advisor Stage" : "Expand Advisor Stage"}
						>
							{expandedAdvisor ? (
								<Minimize2 className="size-3.5" />
							) : (
								<Maximize2 className="size-3.5" />
							)}
						</Button>

						{/* Voice Mute Toggle */}
						<Button
							variant="ghost"
							size="iconSm"
							onClick={() => set({ voiceOn: !voiceOn })}
							className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 size-7 rounded-lg"
							title={voiceOn ? "Mute Voice" : "Unmute Voice"}
						>
							{voiceOn ? (
								<Volume2 className="size-3.5 text-amber-500 dark:text-amber-400" />
							) : (
								<VolumeX className="size-3.5 text-slate-400" />
							)}
						</Button>

						{/* Go Live Button */}
						<Button
							onClick={startLive}
							className="h-8 gap-1.5 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-xs"
							title="Start Photoreal Live Video Avatar"
						>
							<Video className="size-3.5" />
							<span>Go Live</span>
						</Button>
					</div>
				</div>
			)}

			{/* ===== CHAT STREAM ===== */}
			{!live.active && (
				<div
					ref={scrollRef}
					className="flex-1 p-3.5 overflow-y-auto space-y-3 min-h-0 bg-slate-50/50 dark:bg-slate-950/30"
				>
					{chat.map((m) => (
						<div
							key={m.id}
							className={`flex flex-col ${
								m.role === "user" ? "items-end" : "items-start"
							}`}
						>
							<div
								className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
									m.role === "user"
										? "bg-amber-400/20 dark:bg-amber-400/15 border border-amber-400/30 text-amber-950 dark:text-amber-100 rounded-br-none shadow-xs"
										: "bg-white dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 rounded-bl-none shadow-xs"
								}`}
							>
								{m.text}
							</div>
							<span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 px-1 font-mono">
								{m.role === "user" ? "Rahul Sharma" : "Ananya • Private Wealth"}
							</span>
						</div>
					))}

					{thinking && (
						<div className="flex items-center gap-2 text-xs text-amber-900 dark:text-amber-300 bg-amber-400/10 dark:bg-slate-900/90 border border-amber-400/30 rounded-2xl px-3.5 py-2 w-fit shadow-xs">
							<Sparkles className="size-3.5 text-amber-500 dark:text-amber-400 animate-spin" />
							<span>Ananya is calculating strategic allocations…</span>
						</div>
					)}

					{/* Helpful Suggested Actions when chat is young */}
					{chat.length <= 2 && !thinking && (
						<div className="pt-2 space-y-2">
							<p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 px-1">
								Suggested Advisory Prompts
							</p>
							<div className="grid grid-cols-1 gap-1.5">
								{WEALTH_STARTERS.slice(0, 3).map((s, i) => (
									<button
										key={i}
										type="button"
										onClick={() => sendUserText(s)}
										className="text-left p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 text-xs text-slate-700 dark:text-slate-300 hover:border-amber-400/40 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all shadow-2xs group"
									>
										<div className="flex items-center justify-between">
											<span className="line-clamp-1">{s}</span>
											<Sparkles className="size-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
										</div>
									</button>
								))}
							</div>
						</div>
					)}
				</div>
			)}

			{/* ===== TEXT INPUT DOCK ===== */}
			{!live.active && (
				<div className="p-2.5 border-t border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-slate-950/80">
					<form
						onSubmit={(e) => {
							e.preventDefault();
							submit();
						}}
						className="flex items-center gap-1.5"
					>
						<Input
							type="text"
							value={text}
							onChange={(e) => setText(e.target.value)}
							placeholder="Ask Ananya (e.g. 'How can I reach ₹5 Cr by 2042?')..."
							className="bg-slate-100 dark:bg-slate-900/90 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-amber-400/50 text-xs h-9 rounded-lg"
						/>
						<Button
							type="submit"
							disabled={!text.trim()}
							size="iconSm"
							className="size-9 rounded-lg shrink-0 bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-xs"
						>
							<Send className="size-3.5" />
						</Button>
					</form>
				</div>
			)}
		</div>
	);
}

