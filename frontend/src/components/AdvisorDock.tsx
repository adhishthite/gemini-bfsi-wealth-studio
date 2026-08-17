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
} from "lucide-react";
import { useStore } from "@/store";
import { sendUserText } from "@/ws";
import { LiveAvatar } from "@/lib/liveClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const WEALTH_STARTERS = [
	"Review my ₹75L portfolio & goal progress",
	"Show top Flexi Cap & Global AI Tech funds",
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
		<div className="bg-card rounded-2xl border border-border shadow-xs flex flex-col h-full overflow-hidden">
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
						<span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
						<span>Gemini Live Avatar</span>
					</div>
					<Button
						size="sm"
						variant="destructive"
						onClick={stopLive}
						className="h-7 px-2.5 rounded-full text-xs font-bold gap-1"
					>
						<PhoneOff className="size-3.5" />
						<span>End Live</span>
					</Button>
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
					<Button
						onMouseDown={() => talk(true)}
						onMouseUp={() => talk(false)}
						onTouchStart={() => talk(true)}
						onTouchEnd={() => talk(false)}
						variant={live.talking ? "destructive" : "default"}
						className={`rounded-full px-5 py-2 font-bold text-xs shadow-lg transition-transform ${
							live.talking ? "scale-105" : "bg-white text-slate-950 hover:bg-slate-100"
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
				<div className="p-3.5 border-b border-border bg-gradient-to-r from-slate-900 to-[#0B2545] text-white flex items-center justify-between">
					<div className="flex items-center gap-2.5">
						<div className="relative">
							<Avatar className="size-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-200 text-slate-950 shadow-md">
								<AvatarFallback className="rounded-xl bg-transparent text-slate-950 font-black text-sm">
									A
								</AvatarFallback>
							</Avatar>
							<span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-emerald-400 border-2 border-slate-900" />
						</div>
						<div>
							<div className="flex items-center gap-1.5">
								<h3 className="font-bold text-sm leading-none text-white">Ananya</h3>
								<Badge variant="gold" className="text-[10px] py-0 px-1.5">
									Senior RM
								</Badge>
							</div>
							<p className="text-[10px] text-slate-300 mt-1 flex items-center gap-1">
								<ShieldCheck className="size-3 text-emerald-400" />
								<span>{status}</span>
							</p>
						</div>
					</div>

					<div className="flex items-center gap-1.5">
						<Button
							variant="ghost"
							size="iconSm"
							onClick={() => set({ voiceOn: !voiceOn })}
							className="text-white hover:bg-white/10 hover:text-white"
							title={voiceOn ? "Mute Advisor Voice" : "Unmute Advisor Voice"}
						>
							{voiceOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
						</Button>
						<Button
							variant="gold"
							size="sm"
							onClick={startLive}
							className="h-8 gap-1.5 rounded-lg text-xs"
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
					className="flex-1 p-3.5 overflow-y-auto space-y-3 min-h-0 bg-muted/20"
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
										? "bg-primary text-primary-foreground rounded-br-none shadow-xs"
										: "bg-card text-card-foreground border border-border rounded-bl-none shadow-xs"
								}`}
							>
								{m.text}
							</div>
							<span className="text-[9px] text-muted-foreground mt-1 px-1">
								{m.role === "user" ? "Rahul" : "Ananya (Advisory)"}
							</span>
						</div>
					))}

					{thinking && (
						<div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-card border border-border rounded-2xl px-3.5 py-2 w-fit">
							<Sparkles className="size-3.5 text-amber-500 animate-spin" />
							<span>Ananya is calculating allocations…</span>
						</div>
					)}
				</div>
			)}

			{/* ===== QUICK PROMPT CHIPS ===== */}
			{!live.active && (
				<div className="p-2 border-t border-border bg-card overflow-x-auto scrollbar-none flex items-center gap-1.5">
					{WEALTH_STARTERS.map((s, i) => (
						<Button
							key={i}
							variant="outline"
							size="sm"
							onClick={() => sendUserText(s)}
							className="h-7 text-[11px] font-medium whitespace-nowrap bg-muted/40 hover:bg-muted"
						>
							{s}
						</Button>
					))}
				</div>
			)}

			{/* ===== TEXT & MIC INPUT DOCK ===== */}
			{!live.active && (
				<div className="p-3 border-t border-border bg-card">
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
							placeholder="Ask Ananya (e.g. 'How can I reach ₹5 Cr by 2042?')..."
							className="bg-muted/40 text-xs"
						/>
						<Button
							type="submit"
							size="iconSm"
							variant="wealth"
							disabled={!text.trim()}
							className="size-9 rounded-xl shrink-0"
						>
							<Send className="size-4" />
						</Button>
					</form>
				</div>
			)}
		</div>
	);
}
