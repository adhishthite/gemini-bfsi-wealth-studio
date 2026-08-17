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
				visibleFundIds: args.fund_ids && args.fund_ids.length > 0 ? args.fund_ids : null,
				activeTab: "explorer",
			});
			if (args.category) {
				s.setFilter({ category: args.category });
			} else if (!args.fund_ids || args.fund_ids.length === 0) {
				s.setFilter({ category: "All", subCategory: "All" });
			}
			s.pushToast(
				args.fund_ids && args.fund_ids.length > 0
					? `Product Explorer filtered (${args.results_count || 0} funds matched)`
					: "Product Explorer reset to all categories",
				"info",
			);
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
			s.pushToast("Portfolio diagnostics & goal audit loaded", "info");
			break;

		case "update_simulation":
			s.set({
				simulation: args.simulation,
				simulationOpen: true,
				activeTab: "simulation",
			});
			s.pushToast(
				`Portfolio projected to ₹${((args.simulation?.projected_final_corpus_inr || 0) / 10000000).toFixed(2)} Cr by 2042`,
				"success",
			);
			break;

		case "update_basket":
			s.set({
				basket: args.basket || [],
				totalLumpsum: args.total_lumpsum || 0,
				totalSip: args.total_sip || 0,
			});
			s.pushToast("Advisory Basket updated", "info");
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
			s.pushToast("Investment Proposal PDF ready for download", "success");
			break;

		case "mandate_executed":
			s.set({
				mandateStatus: "authorized",
				lastTransactionId: args.transaction_id,
				portfolio: args.portfolio,
			});
			s.pushToast(
				`Mandate ${args.transaction_id} successfully executed!`,
				"success",
			);
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
				basket: msg.basket || [],
				sid: msg.session_id,
				selectedAvatar: avatar,
				live: { ...s.live, available: !!msg.live_available },
			});
			break;
		}

		case "thinking":
			s.set({ thinking: true });
			break;

		case "assistant_text":
			s.set({ thinking: false });
			s.pushChat({ role: "assistant", text: msg.text });
			if (s.voiceOn) speak(msg.text);
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
			s.set({ thinking: false });
			break;

		case "error":
			s.set({ thinking: false });
			s.pushToast(msg.message, "warning");
			break;
	}
}

export function sendUserText(text: string) {
	const s = useStore.getState();
	s.pushChat({ role: "user", text });
	s.set({ thinking: true });
	ws?.send(
		JSON.stringify({ type: "user_text", text, avatar: s.selectedAvatar }),
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

export function sendSetGender(gender: string) {
	ws?.send(JSON.stringify({ type: "set_gender", gender }));
}

let synthVoice: SpeechSynthesisVoice | null = null;
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

export function speak(text: string) {
	if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
	const s = useStore.getState();
	if (!s.voiceOn || s.live.active) return;

	const clean = text.replace(/[*_#`[\]()]/g, "").trim();
	if (!clean) return;

	window.speechSynthesis.cancel();
	const u = new SpeechSynthesisUtterance(clean);
	const v = getVoice();
	if (v) u.voice = v;
	u.rate = 1.05;
	u.onstart = () => useStore.getState().set({ speaking: true });
	u.onend = () => useStore.getState().set({ speaking: false });
	u.onerror = () => useStore.getState().set({ speaking: false });
	window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
	if (typeof window !== "undefined" && "speechSynthesis" in window) {
		window.speechSynthesis.cancel();
	}
	useStore.getState().set({ speaking: false });
}

export function startListening() {
	useStore.getState().set({ listening: true });
}

export function stopListening() {
	useStore.getState().set({ listening: false });
}
