import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
	Microphone as Mic,
	PaperPlaneRight as Send,
	SpeakerHigh as Volume2,
	SpeakerSlash as VolumeX,
	VideoCamera as Video,
	PhoneSlash as PhoneOff,
	ArrowsOut as Maximize2,
	ArrowsIn as Minimize2,
	CircleNotch as Loader2,
	Sparkle as Sparkles,
	Square,
} from "@phosphor-icons/react";
import { useStore } from "@/store";
import { sendUserText, speak, stopSpeaking } from "@/ws";
import { inrCompact, rupee } from "@/lib";
import { LiveAvatar } from "@/lib/liveClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
		currentStep,
		streamingText,
		thinking,
		speaking,
		listening,
		voiceOn,
		connected,
		live,
		expandedAdvisor,
		portfolio,
		profile,
		set,
		pushToast,
	} = useStore();
	const [text, setText] = useState("");
	const [isRecording, setIsRecording] = useState(false);
	const [isTranscribing, setIsTranscribing] = useState(false);
	const scrollRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const client = portfolio || profile;
	const clientName = client?.name || "Rahul Sharma";
	const aum = client?.total_aum_inr ?? 7500000;
	const primaryGoal = client?.goals?.[0];

	const advisoryOpeners = [
		`Review my ${inrCompact(aum)} portfolio and goal progress`,
		client?.risk_profile?.includes("Conservative")
			? "Show conservative hybrid and target maturity debt funds"
			: client?.risk_profile?.includes("Aggressive")
				? "Show high alpha mid cap, small cap and global tech funds"
				: "Show top flexi cap, multi-asset and all-weather funds",
		"Add all-weather volatility protection to basket",
		primaryGoal
			? `Simulate portfolio trajectory for ${primaryGoal.name} (${primaryGoal.target_year})`
			: `Simulate a ${rupee(100000)} monthly SIP for retirement compounding`,
		"Generate the official advisory proposal",
	];
	const captionRef = useRef<HTMLParagraphElement>(null);
	const liveRef = useRef<LiveAvatar | null>(null);

	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const audioChunksRef = useRef<Blob[]>([]);
	const speechRecRef = useRef<any>(null);

	useEffect(() => {
		scrollRef.current?.scrollTo({
			top: scrollRef.current.scrollHeight,
			behavior: "smooth",
		});
	}, [chat, thinking, currentStep, streamingText]);

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

	// STT Voice Recording
	const startRecording = async () => {
		if (isRecording || isTranscribing) return;
		stopSpeaking();
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			audioChunksRef.current = [];

			const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
				? "audio/webm;codecs=opus"
				: MediaRecorder.isTypeSupported("audio/mp4")
					? "audio/mp4"
					: "audio/webm";

			const mr = new MediaRecorder(stream, { mimeType });
			mediaRecorderRef.current = mr;

			mr.ondataavailable = (e) => {
				if (e.data.size > 0) {
					audioChunksRef.current.push(e.data);
				}
			};

			mr.onstop = async () => {
				stream.getTracks().forEach((track) => track.stop());
				const chunks = [...audioChunksRef.current];
				audioChunksRef.current = [];
				const audioBlob = new Blob(chunks, { type: mimeType });
				if (audioBlob.size > 0) {
					setIsTranscribing(true);
					try {
						const res = await fetch("/api/stt", {
							method: "POST",
							headers: { "Content-Type": mimeType },
							body: audioBlob,
						});
						if (res.ok) {
							const data = await res.json();
							const recognized = data.text?.trim();
							if (recognized) {
								setText("");
								sendUserText(recognized);
							} else {
								pushToast("No speech recognized. Please try again.", "warning");
							}
						} else {
							pushToast("Speech transcription error.", "warning");
						}
					} catch (err) {
						console.error("[stt] error:", err);
						pushToast("Failed to transcribe speech audio.", "warning");
					} finally {
						setIsTranscribing(false);
					}
				}
			};

			mr.start(250);
			setIsRecording(true);
			set({ listening: true });

			// Optional browser live recognition preview for instant feedback
			const SpeechRec =
				(window as any).SpeechRecognition ||
				(window as any).webkitSpeechRecognition;
			if (SpeechRec) {
				try {
					const sr = new SpeechRec();
					sr.lang = "en-IN";
					sr.continuous = true;
					sr.interimResults = true;
					sr.onresult = (ev: any) => {
						const lastResult = ev.results[ev.results.length - 1];
						if (lastResult) {
							setText(lastResult[0].transcript);
						}
					};
					sr.onerror = () => {};
					sr.start();
					speechRecRef.current = sr;
				} catch {}
			}
		} catch (err) {
			console.error("[stt] microphone error:", err);
			pushToast(
				"Microphone access was denied. Please allow mic permissions.",
				"warning",
			);
		}
	};

	const stopRecording = () => {
		if (!isRecording) return;
		setIsRecording(false);
		set({ listening: false });

		if (speechRecRef.current) {
			try {
				speechRecRef.current.stop();
			} catch {}
			speechRecRef.current = null;
		}

		if (
			mediaRecorderRef.current &&
			mediaRecorderRef.current.state !== "inactive"
		) {
			mediaRecorderRef.current.stop();
		}
	};

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
			: isRecording
				? "Listening to your voice..."
				: isTranscribing
					? "Transcribing with Gemini..."
					: thinking
						? currentStep || "Reviewing the portfolio"
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
											isRecording
												? "bg-destructive"
												: connected
													? "bg-ink-strong"
													: "bg-ink-faint"
										}`}
										aria-hidden="true"
									/>
									<span className="truncate max-w-[210px]">{status}</span>
								</span>
								<AudioLevel
									active={listening || speaking || thinking || isRecording}
								/>
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
							onClick={() => {
								if (voiceOn) stopSpeaking();
								set({ voiceOn: !voiceOn });
							}}
							title={
								voiceOn
									? "Mute Ananya (Turn off voice playback)"
									: "Unmute Ananya (Turn on voice playback)"
							}
							aria-label={voiceOn ? "Mute Ananya" : "Unmute Ananya"}
							className={`inline-flex size-8 items-center justify-center rounded-lg transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-rule-strong ${
								voiceOn
									? "text-ink-faint hover:bg-paper-sunken hover:text-ink-strong"
									: "bg-paper-sunken text-ink-muted hover:bg-paper-edge hover:text-ink-strong"
							}`}
						>
							{voiceOn ? (
								<Volume2 className="size-4" />
							) : (
								<VolumeX className="size-4 text-destructive" />
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
									<div className="mb-1.5 flex items-center justify-between">
										<p className={isClient ? "label" : "label-strong"}>
											{isClient ? clientName : "Ananya"}
										</p>
										{!isClient && (
											<button
												type="button"
												onClick={() =>
													speak(
														turn.items.map((i) => i.text).join(" "),
														turn.items[0]?.audio,
													)
												}
												title="Listen to Ananya"
												aria-label="Listen to Ananya"
												className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-ink-muted transition-colors hover:bg-paper-sunken hover:text-ink-strong"
											>
												<Volume2 className="size-3" />
												<span>Listen</span>
											</button>
										)}
									</div>
									<div className="space-y-2.5">
										{turn.items.map((m) =>
											isClient ? (
												<p
													key={m.id}
													className="text-base font-medium leading-relaxed text-ink-strong"
												>
													{m.text}
												</p>
											) : (
												<div
													key={m.id}
													className="text-base leading-relaxed text-ink space-y-2"
												>
													<ReactMarkdown
														components={{
															p: ({ children }) => (
																<p className="mb-2 last:mb-0 leading-relaxed">
																	{children}
																</p>
															),
															strong: ({ children }) => (
																<strong className="font-semibold text-ink-strong">
																	{children}
																</strong>
															),
															em: ({ children }) => (
																<em className="italic">{children}</em>
															),
															ul: ({ children }) => (
																<ul className="my-2 list-disc pl-5 space-y-1">
																	{children}
																</ul>
															),
															ol: ({ children }) => (
																<ol className="my-2 list-decimal pl-5 space-y-1">
																	{children}
																</ol>
															),
															li: ({ children }) => (
																<li className="leading-relaxed">{children}</li>
															),
															h1: ({ children }) => (
																<h3 className="font-display font-semibold text-base text-ink-strong my-2">
																	{children}
																</h3>
															),
															h2: ({ children }) => (
																<h3 className="font-display font-semibold text-base text-ink-strong my-2">
																	{children}
																</h3>
															),
															h3: ({ children }) => (
																<h4 className="font-semibold text-sm text-ink-strong my-1.5">
																	{children}
																</h4>
															),
															code: ({ children }) => (
																<code className="font-mono text-xs bg-paper-sunken px-1.5 py-0.5 rounded border border-rule">
																	{children}
																</code>
															),
														}}
													>
														{m.text}
													</ReactMarkdown>
												</div>
											),
										)}
									</div>
								</li>
							);
						})}

						{/* Real-time streaming output & live tool status */}
						{(thinking || currentStep || streamingText) && (
							<li className="mark-quiet space-y-2.5">
								<div className="flex items-center justify-between">
									<p className="label-strong">Ananya</p>
									<AudioLevel active={true} />
								</div>

								{/* Live Tool Execution Status Badge */}
								{currentStep && (
									<div className="inline-flex items-center gap-2 rounded-md border border-stamp/30 bg-stamp/10 px-3 py-1.5 text-xs font-medium text-stamp">
										<Sparkles className="size-3.5 animate-spin text-stamp" />
										<span>{currentStep}</span>
									</div>
								)}

								{/* Live Streaming Token Preview */}
								{streamingText ? (
									<div className="text-base leading-relaxed text-ink space-y-2">
										<ReactMarkdown
											components={{
												p: ({ children }) => (
													<p className="mb-2 last:mb-0 leading-relaxed">
														{children}
													</p>
												),
												strong: ({ children }) => (
													<strong className="font-semibold text-ink-strong">
														{children}
													</strong>
												),
												em: ({ children }) => (
													<em className="italic">{children}</em>
												),
												ul: ({ children }) => (
													<ul className="my-2 list-disc pl-5 space-y-1">
														{children}
													</ul>
												),
												ol: ({ children }) => (
													<ol className="my-2 list-decimal pl-5 space-y-1">
														{children}
													</ol>
												),
												li: ({ children }) => (
													<li className="leading-relaxed">{children}</li>
												),
												code: ({ children }) => (
													<code className="font-mono text-xs bg-paper-sunken px-1.5 py-0.5 rounded border border-rule">
														{children}
													</code>
												),
											}}
										>
											{streamingText}
										</ReactMarkdown>
										<span className="inline-block w-2 h-4 bg-stamp animate-pulse align-middle" />
									</div>
								) : !currentStep ? (
									<p className="text-base leading-relaxed text-ink-faint">
										Reviewing your allocation and goal funding…
									</p>
								) : null}
							</li>
						)}
					</ol>

					{chat.length <= 2 && !thinking && (
						<div className="mt-8 border-t border-rule pt-5">
							<p className="label">Suggested</p>
							<div className="mt-3 grid gap-2">
								{advisoryOpeners.slice(0, 3).map((s) => (
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

			{/* ===== ACTIVE SPEECH STATUS & STOP CONTROL BAR ===== */}
			{!live.active && speaking && (
				<div className="flex items-center justify-between border-t border-rule bg-paper-sunken px-5 py-2">
					<div className="flex items-center gap-2 text-xs font-medium text-ink-strong">
						<span className="size-2 rounded-full bg-stamp" />
						<span>Ananya is speaking...</span>
					</div>
					<Button
						type="button"
						onClick={stopSpeaking}
						size="sm"
						variant="destructive"
						title="Stop voice playback"
						className="h-6 gap-1 rounded-md px-2.5 text-[11px] font-semibold shadow-none"
					>
						<Square className="size-2.5 fill-current" />
						<span>Stop Voice</span>
					</Button>
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
						{/* Speech-to-Text Microphone Button */}
						{isRecording ? (
							<Button
								type="button"
								onClick={stopRecording}
								title="Stop recording & send voice input"
								aria-label="Stop recording"
								className="size-10 shrink-0 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive-hover shadow-none"
							>
								<Square className="size-4" />
							</Button>
						) : (
							<Button
								type="button"
								onClick={startRecording}
								disabled={isTranscribing}
								title="Speak to Ananya (Voice input with Gemini STT)"
								aria-label="Start voice input"
								className="size-10 shrink-0 rounded-lg border border-rule bg-paper-sunken text-ink hover:bg-paper-edge hover:text-ink-strong shadow-none"
							>
								{isTranscribing ? (
									<Loader2 className="size-4 animate-spin text-stamp" />
								) : (
									<Mic className="size-4" />
								)}
							</Button>
						)}

						<Input
							type="text"
							value={text}
							onChange={(e) => setText(e.target.value)}
							placeholder={
								isRecording
									? "Listening to you... Speak now"
									: isTranscribing
										? "Transcribing voice via Gemini STT..."
										: "Ask Ananya about the portfolio, goals or mandate"
							}
							className="paper-sunken h-10 flex-1 rounded-lg border-rule text-sm text-ink placeholder:text-ink-faint focus-visible:ring-1 focus-visible:ring-rule-strong focus-visible:ring-offset-0"
						/>
						<Button
							type="submit"
							disabled={!text.trim() || isRecording}
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
