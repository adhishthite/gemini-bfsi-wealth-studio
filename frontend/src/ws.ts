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
  ws.onmessage = (ev) => handle(JSON.parse(ev.data) as ServerMsg);
}

function handle(msg: ServerMsg) {
  const s = useStore.getState();
  switch (msg.type) {
    case "init": {
      const avatar = s.selectedAvatar || (msg as any).default_avatar || "Kira";
      s.set({
        catalog: msg.catalog, profile: msg.profile, sid: msg.session_id, selectedAvatar: avatar,
        orders: (msg as any).orders ?? [],
        live: { ...s.live, available: !!msg.live_available },
      });
      ws?.send(JSON.stringify({ type: "set_persona", avatar })); // stylist name/voice only
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
      s.applyCommand(msg.command, (msg as any).args);
      break;
    case "turn_complete":
      s.set({ thinking: false });
      break;
    case "error":
      s.set({ thinking: false });
      s.pushToast(msg.message);
      break;
  }
}

export function sendUserText(text: string) {
  const s = useStore.getState();
  s.pushChat({ role: "user", text });
  s.set({ thinking: true });
  ws?.send(JSON.stringify({ type: "user_text", text, avatar: s.selectedAvatar }));
}

// Select a stylist avatar — changes the stylist's face/voice/name only. NOT the catalog gender.
export function selectAvatar(name: string) {
  useStore.getState().set({ selectedAvatar: name });
  ws?.send(JSON.stringify({ type: "set_persona", avatar: name }));
}

// Explicit "shopping for" control (the gender tabs) — tells the AI which section to default to.
export function sendSetGender(gender: "all" | "women" | "men") {
  ws?.send(JSON.stringify({ type: "set_gender", gender }));
}

// Direct, instant action — no LLM round-trip (real-app cart/sizing/checkout behaviour)
export function sendAction(action: string, payload: Record<string, any> = {}) {
  ws?.send(JSON.stringify({ type: "action", action, ...payload }));
}

// ---------- Browser TTS (fallback voice out) ----------
let voices: SpeechSynthesisVoice[] = [];
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  const load = () => (voices = window.speechSynthesis.getVoices());
  load();
  window.speechSynthesis.onvoiceschanged = load;
}
function pickVoice() {
  return (
    voices.find((v) => /en-IN/i.test(v.lang)) ||
    voices.find((v) => /en-GB/i.test(v.lang) && /female|Google UK English Female/i.test(v.name)) ||
    voices.find((v) => /en/i.test(v.lang)) ||
    null
  );
}
export function speak(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/₹/g, " rupees "));
  const v = pickVoice();
  if (v) u.voice = v;
  u.rate = 1.04;
  u.pitch = 1.05;
  u.onstart = () => useStore.getState().set({ speaking: true });
  u.onend = () => useStore.getState().set({ speaking: false });
  window.speechSynthesis.speak(u);
}
export function stopSpeaking() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

// ---------- Browser STT (fallback voice in) ----------
type SR = any;
let recognition: SR = null;
export function startListening(onText: (t: string) => void) {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) {
    useStore.getState().pushToast("Voice input isn't supported in this browser — type instead.");
    return;
  }
  recognition = new SpeechRecognition();
  recognition.lang = "en-IN";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onresult = (e: any) => {
    const t = e.results[0][0].transcript;
    onText(t);
  };
  recognition.onend = () => useStore.getState().set({ listening: false });
  recognition.onerror = () => useStore.getState().set({ listening: false });
  useStore.getState().set({ listening: true });
  recognition.start();
}
export function stopListening() {
  recognition?.stop();
  useStore.getState().set({ listening: false });
}
