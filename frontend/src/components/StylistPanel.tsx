import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Send, Volume2, VolumeX, Sparkles, Square, Video, PhoneOff } from "lucide-react";
import { useStore } from "../store";
import { sendUserText, startListening, stopListening, stopSpeaking } from "../ws";
import { avatarImg } from "../lib";
import { LiveAvatar } from "../lib/liveClient";
import AvatarPicker from "./AvatarPicker";

const STARTERS = [
  "I have my cousin's sangeet in Udaipur in December",
  "Help me pack for a Goa beach wedding",
  "Something for Diwali dinner at home",
  "Smart outfits for my first week at a Bengaluru startup",
];

export default function StylistPanel() {
  const { chat, thinking, speaking, listening, voiceOn, connected, selectedAvatar, live, set } = useStore();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captionRef = useRef<HTMLParagraphElement>(null);
  const liveRef = useRef<LiveAvatar | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat, thinking]);

  // keep the live caption scrolled to the newest words (it grows over the turn)
  useEffect(() => {
    const el = captionRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [live.caption]);

  const startLive = async () => {
    if (!canvasRef.current || live.active) return;
    stopSpeaking(); set({ voiceOn: false });
    liveRef.current = new LiveAvatar(canvasRef.current);
    try { await liveRef.current.start(useStore.getState().selectedAvatar); }
    catch { useStore.getState().pushToast("Couldn't start the live avatar (mic permission?)"); }
  };
  const stopLive = () => { liveRef.current?.stop(); liveRef.current = null; };
  useEffect(() => () => liveRef.current?.stop(), []);

  // push-to-talk: hold the mic button or the spacebar to speak
  const talk = (on: boolean) => liveRef.current?.setTalking(on);
  useEffect(() => {
    if (!live.active) return;
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat && document.activeElement?.tagName !== "TEXTAREA") { e.preventDefault(); talk(true); }
    };
    const up = (e: KeyboardEvent) => { if (e.code === "Space") { e.preventDefault(); talk(false); } };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [live.active]);

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    if (live.active) { liveRef.current?.sendText(t); useStore.getState().pushChat({ role: "user", text: t }); }
    else sendUserText(t);
    setText("");
  };

  const status = live.active ? (live.status === "connecting" ? "Connecting…" : live.status === "speaking" ? "Speaking…" : "Listening…")
    : !connected ? "Connecting…"
    : thinking ? "Styling…"
    : listening ? "Listening…"
    : speaking ? "Speaking…"
    : "Online";

  return (
    <div className="glass rounded-xl2 shadow-glass flex flex-col h-full overflow-hidden">
      {/* ===== LIVE STAGE: full-size avatar + subtitle transcript overlay (canvas stays mounted) ===== */}
      <div className={live.active ? "relative flex-1 min-h-0 bg-black overflow-hidden" : "hidden"}>
        {/* The stage is more portrait than the avatar video, so object-cover shows the FULL height (incl. the
            video's built-in headroom). Scaling up from the bottom lifts the figure and crops that empty headroom
            off the top while keeping the body anchored (no black gap). Bump the scale (1.1–1.4) if a given
            avatar still sits low / shows a gap above the head. */}
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-cover object-center scale-[1.1] origin-bottom" />
        <span className="absolute top-3 left-3 chip bg-black/55 text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE · {selectedAvatar}
        </span>
        <span className="absolute top-3 right-3 chip bg-black/45 text-white capitalize">{status}</span>
        {/* bottom stack: slim caption ticker sits just above the controls — never over the face */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col bg-gradient-to-t from-black/85 via-black/45 to-transparent">
          {live.caption && (
            <div className="px-4 pb-1.5 animate-fade-up">
              <p ref={captionRef}
                className="mx-auto max-w-md text-center text-white text-[13.5px] leading-snug max-h-40 overflow-y-auto scroll-thin bg-black/55 backdrop-blur-sm rounded-xl px-3.5 py-2.5">
                {live.caption}
              </p>
            </div>
          )}
          <div className="p-4 pt-1.5 flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-3">
            <button
              onPointerDown={(e) => { e.preventDefault(); talk(true); }}
              onPointerUp={() => talk(false)}
              onPointerLeave={() => talk(false)}
              aria-label="Hold to talk"
              className={`inline-flex items-center gap-2 h-12 px-6 rounded-full font-semibold transition select-none active:scale-95
                ${live.talking ? "bg-brand-gradient text-white shadow-glass scale-105" : "bg-white text-brand-ink"}`}>
              {live.talking ? <Mic size={18} /> : <MicOff size={18} />}
              {live.talking ? "Listening…" : "Hold to talk"}
            </button>
            <button onClick={stopLive} aria-label="End live"
              className="grid place-items-center h-12 w-12 rounded-full bg-red-500 text-white shadow-lift active:scale-90">
              <PhoneOff size={18} />
            </button>
          </div>
          <p className="text-[11px] text-white/70">Hold the button or <kbd className="px-1 rounded bg-white/20">Space</kbd> to talk</p>
          </div>
        </div>
      </div>

      {/* ===== NORMAL VIEW (header + chat transcript), hidden during live ===== */}
      <div className={live.active ? "hidden" : "relative px-5 pt-5 pb-4 bg-gradient-to-b from-violet-50/80 to-transparent"}>
        <div className="flex items-center gap-3.5">
          <AvatarPicker />
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-brand-ink leading-tight">{selectedAvatar}</h2>
            <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1.5">
              <Sparkles size={12} className="text-brand-purple" />
              AI Stylist
              <span className="text-stone-300">·</span>
              <span className={`h-1.5 w-1.5 rounded-full ${thinking || listening || speaking ? "bg-brand-pink animate-pulse" : "bg-emerald-500"}`} />
              {status}
            </p>
          </div>
          <button
            onClick={() => { stopSpeaking(); set({ voiceOn: !voiceOn }); }}
            aria-label={voiceOn ? "Mute stylist voice" : "Unmute stylist voice"}
            className="shrink-0 grid place-items-center h-9 w-9 rounded-full bg-white/70 border border-brand-ink/10 text-brand-ink/70 hover:text-brand-ink transition">
            {voiceOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
        </div>
        {live.available && (
          <button onClick={startLive} className="btn-primary w-full mt-3.5" aria-label="Start live avatar">
            <Video size={16} /> Go Live with {selectedAvatar}
          </button>
        )}
      </div>

      {/* Transcript (chat) — hidden during live (the subtitle overlay is the live transcript) */}
      <div ref={scrollRef} className={`flex-1 overflow-y-auto scroll-thin px-4 py-3 space-y-3 ${live.active ? "hidden" : ""}`}>
        {chat.length === 0 && (
          <div className="space-y-3 animate-fade-up">
            <p className="text-sm text-stone-600 leading-relaxed">
              Hi, I'm <span className="font-semibold brand-text">{selectedAvatar}</span> — your personal stylist at
              Cymbal Direct. Tell me the occasion and I'll build the look, find your size, and even show it on you.
            </p>
            <div className="grid gap-2">
              {STARTERS.map((s) => (
                <button key={s} onClick={() => sendUserText(s)}
                  className="text-left text-[13px] rounded-2xl px-3.5 py-2.5 bg-white/80 border border-violet-100
                    text-brand-ink/85 hover:border-brand-purple/40 hover:bg-white transition-all hover:shadow-soft">
                  “{s}”
                </button>
              ))}
            </div>
          </div>
        )}
        {chat.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-fade-up`}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed
              ${m.role === "user"
                ? "bg-brand-gradient text-white rounded-br-md shadow-glass"
                : "bg-white text-brand-ink rounded-bl-md border border-stone-200/80 shadow-soft"}`}>
              {m.text}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex justify-start animate-fade-up">
            <div className="bg-white rounded-2xl rounded-bl-md border border-stone-200/80 px-4 py-3 shadow-soft">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-1.5 w-1.5 rounded-full bg-brand-purple/60 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/60 bg-white/50">
        <div className="flex items-end gap-2">
          {!live.active && (
            <button
              onClick={() => (listening ? stopListening() : startListening((t) => sendUserText(t)))}
              aria-label={listening ? "Stop listening" : `Speak to ${selectedAvatar}`}
              className={`grid place-items-center h-11 w-11 shrink-0 rounded-full transition-all duration-200 active:scale-90
                ${listening ? "bg-brand-pink text-white shadow-glass" : "bg-white border border-brand-ink/10 text-brand-ink/70 hover:text-brand-purple"}`}>
              {listening ? <Square size={16} /> : <Mic size={18} />}
            </button>
          )}
          <div className="flex-1 flex items-end gap-2 bg-white rounded-2xl border border-brand-ink/10 px-3 py-1.5 focus-within:border-brand-purple/50 transition">
            <textarea
              value={text} rows={1}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
              placeholder={`Message ${selectedAvatar}…`}
              className="flex-1 resize-none bg-transparent py-1.5 text-sm outline-none placeholder:text-stone-400 max-h-24"
            />
            <button onClick={submit} disabled={!text.trim()} aria-label="Send"
              className="grid place-items-center h-8 w-8 shrink-0 rounded-full bg-brand-gradient text-white disabled:opacity-40 transition active:scale-90 mb-0.5">
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
