import { useStore } from "./store";
import type { ServerMsg } from "./types";

let ws: WebSocket | null = null;
let reconnectTimer: any = null;

export function connect() {
	const proto = location.protocol === "https:" ? "wss" : "ws";
	ws = new WebSocket(`${proto}://${location.host}/ws`);

	ws.onopen = () => useStore.getState().set({ connected: true });
	ws.onclose = () => {
		useStore.getState().set({ connected: false });
		reconnectTimer = setTimeout(connect, 1500);
	};
	ws.onmessage = (ev) => {
		try {
			const msg = JSON.parse(ev.data);
			handle(msg);
		} catch (e) {
			console.error("[ws] parse error", e);
		}
	};
}

export function handleUiCommand(command: string, args: any) {
	const s = useStore.getState();
	switch (command) {
		case "filter_catalog":
			s.set({
				visibleFundIds:
					args.fund_ids && args.fund_ids.length > 0 ? args.fund_ids : null,
				activeTab: "explorer",
			});
			if (args.category) {
				s.setFilter({
					category: args.category,
					subCategory: args.sub_category || "All",
					query: args.query || "",
				});
			} else if (!args.fund_ids || args.fund_ids.length === 0) {
				s.setFilter({ category: "All", subCategory: "All", query: "" });
			}
			break;

		case "highlight_products":
			s.set({ highlightIds: args.product_ids || [], activeTab: "explorer" });
			setTimeout(() => s.set({ highlightIds: [] }), 4000);
			break;

		case "show_portfolio_diagnostics":
			s.set({
				diagnostics: args.diagnostics,
				diagnosticsOpen: true,
				activeTab: "diagnostics",
			});
			break;

		case "update_simulation":
			s.set({
				simulation: args.simulation,
				simulationOpen: true,
				activeTab: "simulation",
			});
			break;

		case "update_basket":
			s.set({
				basket: args.basket || [],
				totalLumpsum: args.total_lumpsum || 0,
				totalSip: args.total_sip || 0,
			});
			break;

		case "open_modal":
			if (args.modal === "basket") s.set({ basketOpen: true });
			if (args.modal === "mandate_authorization")
				s.set({ mandateModalOpen: true, mandateStatus: "awaiting_otp" });
			if (args.modal === "diagnostics") s.set({ diagnosticsOpen: true });
			if (args.modal === "simulation") s.set({ simulationOpen: true });
			if (args.modal === "proposal") s.set({ proposalOpen: true });
			break;

		case "proposal_ready":
			s.set({ proposal: args.proposal, proposalOpen: true });
			break;

		case "mandate_executed":
			s.set({
				mandateStatus: "authorized",
				lastTransactionId: args.transaction_id,
				portfolio: args.portfolio,
			});
			break;
	}
}

function handle(msg: any) {
	const s = useStore.getState();
	const mtype = msg.type;

	switch (mtype) {
		case "init": {
			const avatar = s.selectedAvatar || msg.default_avatar || "Ananya";
			s.set({
				funds: msg.funds || msg.catalog || [],
				profile: msg.profile,
				portfolio: msg.portfolio || msg.profile,
				activeProfileKey: msg.active_profile_key || "investor",
				profiles: msg.profiles || {},
				basket: msg.basket || [],
				sid: msg.session_id,
				selectedAvatar: avatar,
				live: { ...s.live, available: !!msg.live_available },
			});
			break;
		}

		case "profile_switched": {
			const clientName = msg.profile?.name || "Rahul Sharma";
			const aum = msg.profile?.total_aum_inr ?? 7500000;
			const aumStr =
				aum >= 10000000
					? `₹${(aum / 10000000).toFixed(2)} Cr`
					: `₹${Math.round(aum / 100000)}L`;

			let salutation = clientName.split(" ")[0];
			if (clientName.includes("Dr.")) {
				salutation =
					"Dr. " +
					(clientName.split(" ")[2] || clientName.split(" ")[1] || "Singhania");
			} else if (clientName.includes("Anand")) {
				salutation = "Anand-ji";
			}

			const avatarName = s.selectedAvatar || "Ananya";
			const welcomeText = `Namaste ${salutation}! I'm ${avatarName}, your Senior Private Wealth Advisor at Cymbal Premier. How can I assist you with your ${aumStr} portfolio and goal milestones today?`;

			s.set({
				profile: msg.profile,
				portfolio: msg.portfolio || msg.profile,
				activeProfileKey: msg.profile_key,
				basket: msg.basket || [],
				totalLumpsum: 0,
				totalSip: 0,
				diagnostics: null,
				simulation: null,
				mandateStatus: "idle",
				chat: [
					{
						id: Date.now(),
						role: "assistant",
						text: welcomeText,
						timestamp: Date.now(),
					},
				],
			});
			break;
		}

		case "thinking":
			s.set({
				thinking: true,
				currentStep: "Consulting Fiduciary Brain...",
				streamingText: null,
			});
			break;

		case "status_step":
			s.set({ thinking: true, currentStep: msg.step });
			break;

		case "stream_chunk":
			s.set({
				streamingText: (useStore.getState().streamingText || "") + msg.chunk,
			});
			break;

		case "assistant_text":
			s.set({ thinking: false, currentStep: null, streamingText: null });
			s.pushChat({ role: "assistant", text: msg.text, audio: msg.audio });
			if (s.voiceOn) speak(msg.text, msg.audio);
			break;

		case "ui_command":
			handleUiCommand(msg.command, msg.args);
			break;

		case "filter_catalog":
		case "highlight_products":
		case "show_portfolio_diagnostics":
		case "update_simulation":
		case "update_basket":
		case "open_modal":
		case "proposal_ready":
		case "mandate_executed":
			handleUiCommand(mtype, msg);
			break;

		case "turn_complete":
			s.set({ thinking: false, currentStep: null, streamingText: null });
			break;

		case "error":
			s.set({ thinking: false, currentStep: null, streamingText: null });
			s.pushToast(msg.message, "warning");
			break;
	}
}

let lastSentUserText = "";
let lastSentUserTime = 0;

export function sendUserText(text: string) {
	const trimmed = text.trim();
	if (!trimmed) return;
	const now = Date.now();
	if (trimmed === lastSentUserText && now - lastSentUserTime < 1200) {
		return;
	}
	lastSentUserText = trimmed;
	lastSentUserTime = now;

	const s = useStore.getState();
	s.pushChat({ role: "user", text: trimmed });
	s.set({
		thinking: true,
		currentStep: "Consulting Fiduciary Brain...",
		streamingText: null,
	});
	ws?.send(
		JSON.stringify({
			type: "user_text",
			text: trimmed,
			avatar: s.selectedAvatar,
		}),
	);
}

export function sendAction(action: string, data: Record<string, any> = {}) {
	ws?.send(JSON.stringify({ type: "action", action, ...data }));
}

export function selectAvatar(avatar: string) {
	useStore.getState().set({ selectedAvatar: avatar });
	ws?.send(JSON.stringify({ type: "set_persona", avatar }));
}

export function setPersona(avatar: string) {
	selectAvatar(avatar);
}

export function switchProfile(profileKey: string) {
	ws?.send(JSON.stringify({ type: "switch_profile", profile_key: profileKey }));
}

export function sendSetGender(gender: string) {
	ws?.send(JSON.stringify({ type: "set_gender", gender }));
}

let currentAudio: HTMLAudioElement | null = null;
let synthVoice: SpeechSynthesisVoice | null = null;
let currentSpeakId = 0;
let isSpeakingStopped = false;

function getVoice(): SpeechSynthesisVoice | null {
	if (synthVoice) return synthVoice;
	if (typeof window === "undefined" || !("speechSynthesis" in window))
		return null;
	const vs = window.speechSynthesis.getVoices();
	synthVoice =
		vs.find((v) => v.lang.startsWith("en-IN") || v.name.includes("India")) ||
		vs.find((v) => v.lang.startsWith("en-GB")) ||
		vs.find((v) => v.lang.startsWith("en")) ||
		vs[0] ||
		null;
	return synthVoice;
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
	window.speechSynthesis.onvoiceschanged = () => {
		synthVoice = null;
		getVoice();
	};
}

export function stopSpeaking() {
	currentSpeakId++;
	isSpeakingStopped = true;

	if (currentAudio) {
		// Detach listeners before pausing/clearing src so onerror/onended do not trigger fallback synthesis
		currentAudio.onplay = null;
		currentAudio.onended = null;
		currentAudio.onerror = null;
		try {
			currentAudio.pause();
			currentAudio.src = "";
		} catch {
			// ignore pause/src reset notices
		}
		currentAudio = null;
	}

	if (typeof window !== "undefined" && "speechSynthesis" in window) {
		try {
			window.speechSynthesis.cancel();
		} catch {
			// ignore cancel notices
		}
	}

	useStore.getState().set({ speaking: false });
}

export async function speak(text: string, audioBase64?: string) {
	const s = useStore.getState();
	if (!s.voiceOn || s.live.active) return;

	stopSpeaking();

	const speakId = ++currentSpeakId;
	isSpeakingStopped = false;

	let b64 = audioBase64;
	if (!b64 && typeof window !== "undefined") {
		try {
			const res = await fetch(
				`/api/tts?text=${encodeURIComponent(text)}&avatar=${encodeURIComponent(s.selectedAvatar || "Ananya")}`,
			);
			if (speakId !== currentSpeakId || isSpeakingStopped) return;
			if (res.ok) {
				const data = await res.json();
				if (data.audio) b64 = data.audio;
			}
		} catch (e) {
			if (speakId !== currentSpeakId || isSpeakingStopped) return;
			console.warn("[tts] fetch /api/tts notice:", e);
		}
	}

	if (speakId !== currentSpeakId || isSpeakingStopped) return;

	if (b64) {
		try {
			const audio = new Audio(`data:audio/mp3;base64,${b64}`);
			currentAudio = audio;
			audio.onplay = () => {
				if (speakId !== currentSpeakId || isSpeakingStopped) {
					audio.pause();
					return;
				}
				useStore.getState().set({ speaking: true });
			};
			audio.onended = () => {
				if (currentAudio === audio) currentAudio = null;
				useStore.getState().set({ speaking: false });
			};
			audio.onerror = () => {
				if (currentAudio === audio) currentAudio = null;
				useStore.getState().set({ speaking: false });
				// Never trigger fallback synthesis if playback was explicitly stopped by user
				if (speakId !== currentSpeakId || isSpeakingStopped) return;
				speakBrowserFallback(text, speakId);
			};

			await audio.play();
			return;
		} catch (e: any) {
			// AbortError is expected if stopSpeaking() paused the audio while play() was pending
			if (
				speakId !== currentSpeakId ||
				isSpeakingStopped ||
				e?.name === "AbortError"
			) {
				return;
			}
			console.warn("[tts] DeepMind audio playback notice:", e);
		}
	}

	if (speakId !== currentSpeakId || isSpeakingStopped) return;
	speakBrowserFallback(text, speakId);
}

function speakBrowserFallback(text: string, speakId?: number) {
	if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
	if (
		speakId !== undefined &&
		(speakId !== currentSpeakId || isSpeakingStopped)
	)
		return;

	const clean = text.replace(/[*_#`[\]()]/g, "").trim();
	if (!clean) return;

	try {
		window.speechSynthesis.cancel();
	} catch {
		// ignore cancel notices
	}

	const u = new SpeechSynthesisUtterance(clean);
	const v = getVoice();
	if (v) u.voice = v;
	u.rate = 1.05;
	u.onstart = () => {
		if (
			speakId !== undefined &&
			(speakId !== currentSpeakId || isSpeakingStopped)
		) {
			window.speechSynthesis.cancel();
			useStore.getState().set({ speaking: false });
			return;
		}
		useStore.getState().set({ speaking: true });
	};
	u.onend = () => useStore.getState().set({ speaking: false });
	u.onerror = () => useStore.getState().set({ speaking: false });
	window.speechSynthesis.speak(u);
}

export function startListening() {
	useStore.getState().set({ listening: true });
}

export function stopListening() {
	useStore.getState().set({ listening: false });
}
