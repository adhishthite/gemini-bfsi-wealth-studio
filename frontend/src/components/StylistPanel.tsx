import { useEffect, useRef, useState } from "react";
import {
	Mic,
	MicOff,
	Send,
	Volume2,
	VolumeX,
	Sparkles,
	Square,
	Video,
	PhoneOff,
	TrendingUp,
	ShieldCheck,
	FileText,
} from "lucide-react";
import { useStore } from "../store";
import { sendUserText } from "../ws";
import { LiveAvatar } from "../lib/liveClient";

const WEALTH_STARTERS = [
	"Review my ₹75L portfolio & goal progress",
	"Show top Flexi Cap & Global AI Tech funds",
	"Add all-weather volatility protection",
	"Simulate ₹1 Lakh/month SIP for 2042 Retirement",
	"Generate official Advisory Proposal PDF",
];

export default function StylistPanel() {
	const {
		chat,
		thinking,
		speaking,
		listening,
		voiceOn,
		connected,
		selectedAvatar,
		live,
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
				? "Analyzing Portfolio…"
				: listening
					? "Listening…"
					: speaking
						? "Ananya Speaking…"
						: "Advisory Online";

	return (
		<div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
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
					className="absolute inset-0 h-full w-full object-cover object-center scale-[1.1] origin-bottom"
				/>

				{/* Live Status Overlay */}
				<div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
					<div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-semibold">
						<span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
						<span>Gemini Live Avatar</span>
					</div>
					<button
						onClick={stopLive}
						className="flex items-center gap-1 bg-rose-600/90 text-white px-2.5 py-1 rounded-full text-xs font-bold hover:bg-rose-700 transition"
					>
						<PhoneOff size={13} />
						<span>End Live</span>
					</button>
				</div>

				{/* Live Subtitle Transcript */}
				<div className="absolute bottom-16 left-3 right-3 bg-black/70 backdrop-blur-md rounded-xl p-3 z-10">
					<p
						ref={captionRef}
						className="text-xs text-white leading-relaxed max-h-20 overflow-y-auto font-medium"
					>
						{live.caption ||
							"Hold Spacebar or the Mic button to talk with Ananya..."}
					</p>
				</div>

				{/* Push-to-Talk Floating Bar */}
				<div className="absolute bottom-3 left-0 right-0 flex justify-center z-10">
					<button
						onMouseDown={() => talk(true)}
						onMouseUp={() => talk(false)}
						onTouchStart={() => talk(true)}
						onTouchEnd={() => talk(false)}
						className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold text-xs shadow-lg transition ${
							live.talking
								? "bg-rose-500 text-white scale-105"
								: "bg-white text-slate-900 hover:bg-slate-100"
						}`}
					>
						<Mic size={15} className={live.talking ? "animate-pulse" : ""} />
						<span>
							{live.talking ? "Release to Send" : "Hold to Talk (or Spacebar)"}
						</span>
					</button>
				</div>
			</div>

			{/* ===== STANDARD ADVISOR HEADER ===== */}
			{!live.active && (
				<div className="p-3.5 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-[#0B2545] text-white flex items-center justify-between">
					<div className="flex items-center gap-2.5">
						<div className="relative">
							<div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-200 text-slate-950 flex items-center justify-center font-black text-sm shadow-md">
								A
							</div>
							<span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-slate-900" />
						</div>
						<div>
							<div className="flex items-center gap-1.5">
								<h3 className="font-bold text-sm leading-none">Ananya</h3>
								<span className="text-[10px] text-amber-300 bg-amber-400/20 px-1.5 py-0.5 rounded font-semibold">
									Senior RM
								</span>
							</div>
							<p className="text-[10px] text-slate-300 mt-1 flex items-center gap-1">
								<ShieldCheck size={11} className="text-emerald-400" />
								<span>{status}</span>
							</p>
						</div>
					</div>

					<div className="flex items-center gap-1.5">
						<button
							onClick={() => set({ voiceOn: !voiceOn })}
							className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
							title={voiceOn ? "Mute Advisor Voice" : "Unmute Advisor Voice"}
						>
							{voiceOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
						</button>
						<button
							onClick={startLive}
							className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition shadow-sm"
							title="Start Photoreal Live Video Avatar"
						>
							<Video size={13} />
							<span>Go Live</span>
						</button>
					</div>
				</div>
			)}

			{/* ===== CHAT STREAM ===== */}
			{!live.active && (
				<div
					ref={scrollRef}
					className="flex-1 p-3.5 overflow-y-auto space-y-3 min-h-0 bg-slate-50/50"
				>
					{chat.map((m) => (
						<div
							key={m.id}
							className={`flex flex-col ${
								m.role === "user" ? "items-end" : "items-start"
							}`}
						>
							<div
								className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
									m.role === "user"
										? "bg-[#0B2545] text-white rounded-br-none shadow-sm"
										: "bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-xs"
								}`}
							>
								{m.text}
							</div>
							<span className="text-[9px] text-slate-400 mt-1 px-1">
								{m.role === "user" ? "Rahul" : "Ananya (Advisory)"}
							</span>
						</div>
					))}

					{thinking && (
						<div className="flex items-center gap-1.5 text-xs text-slate-500 bg-white border border-slate-200 rounded-2xl px-3.5 py-2 w-fit">
							<Sparkles size={13} className="text-amber-500 animate-spin" />
							<span>Ananya is calculating allocations…</span>
						</div>
					)}
				</div>
			)}

			{/* ===== QUICK PROMPT CHIPS ===== */}
			{!live.active && (
				<div className="p-2 border-t border-slate-100 bg-white overflow-x-auto scrollbar-none flex items-center gap-1.5">
					{WEALTH_STARTERS.map((s, i) => (
						<button
							key={i}
							onClick={() => sendUserText(s)}
							className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium whitespace-nowrap transition"
						>
							{s}
						</button>
					))}
				</div>
			)}

			{/* ===== TEXT & MIC INPUT DOCK ===== */}
			{!live.active && (
				<div className="p-3 border-t border-slate-200 bg-white">
					<form
						onSubmit={(e) => {
							e.preventDefault();
							submit();
						}}
						className="flex items-center gap-2"
					>
						<input
							type="text"
							value={text}
							onChange={(e) => setText(e.target.value)}
							placeholder="Ask Ananya (e.g. 'How can I reach ₹5 Cr by 2042?')..."
							className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B2545]/20 focus:border-[#0B2545]"
						/>
						<button
							type="submit"
							disabled={!text.trim()}
							className="h-8 w-8 rounded-xl bg-[#0B2545] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[#134074] transition shadow-xs"
						>
							<Send size={14} />
						</button>
					</form>
				</div>
			)}
		</div>
	);
}
