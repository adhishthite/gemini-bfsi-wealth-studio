// Live Avatar client — faithful TS port of the proven reference (live-av):
// raw Gemini Live protocol over /ws/live, fragmented-MP4 video via MSE on a <canvas>,
// 24kHz PCM playback + 16kHz mic capture, with tool-driven ui_command routing.
import { useStore } from "../store";

const b64ToBytes = (b64: string) => {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};
const bytesToB64 = (bytes: Uint8Array) => {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
};

export class LiveAvatar {
  private ws: WebSocket | null = null;
  private canvas: HTMLCanvasElement;
  private video: HTMLVideoElement;
  private ctx: CanvasRenderingContext2D;
  private ms: MediaSource | null = null;
  private sb: SourceBuffer | null = null;
  private queue: ArrayBuffer[] = [];
  private initSeg: ArrayBuffer | null = null;
  private raf = 0;
  // audio
  private inCtx: AudioContext | null = null;
  private outCtx: AudioContext | null = null;
  private gain: GainNode | null = null;
  private stream: MediaStream | null = null;
  private proc: ScriptProcessorNode | null = null;
  private srcNode: MediaStreamAudioSourceNode | null = null;
  private sources = new Set<AudioBufferSourceNode>();
  private nextStart = 0;
  private muted = true;            // push-to-talk: mic streams only while the user holds to talk
  private silence = new Uint8Array(512 * 2);
  private userStopped = false;
  private lastError = "";

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    // The avatar's VOICE is muxed into the MP4, so the <video> must be in the DOM
    // and UNMUTED to output audio. It's kept invisible; the canvas shows the frames.
    this.video = document.createElement("video");
    this.video.playsInline = true;
    this.video.autoplay = true;
    this.video.muted = false;
    this.video.volume = 1;
    this.video.setAttribute("style", "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-10px;bottom:-10px");
    document.body.appendChild(this.video);
    this.startRenderLoop();
  }

  // push-to-talk: hold → activityStart + stream mic; release → activityEnd (model then replies)
  setTalking(on: boolean) {
    if (on === !this.muted) return;
    if (on) {
      this.ws?.send(JSON.stringify({ realtimeInput: { activityStart: {} } }));
      this.muted = false;
    } else {
      this.muted = true;
      this.ws?.send(JSON.stringify({ realtimeInput: { activityEnd: {} } }));
    }
    const s = useStore.getState();
    s.set({ live: { ...s.live, talking: on, status: on ? "listening" : "thinking" } });
  }

  private stopPlayback() {
    this.sources.forEach((src) => { try { src.stop(); } catch {} src.disconnect(); });
    this.sources.clear();
    this.nextStart = 0;
  }

  // Create + unlock the output AudioContext inside the Go-Live click (user gesture),
  // otherwise the browser keeps it suspended and PCM avatar audio is silent.
  private ensureOutput() {
    if (!this.outCtx) {
      this.outCtx = new AudioContext({ sampleRate: 24000 });
      this.gain = this.outCtx.createGain();
      this.gain.connect(this.outCtx.destination);
      this.nextStart = 0;
    }
    if (this.outCtx.state === "suspended") this.outCtx.resume().catch(() => {});
  }

  async start(avatar = "") {
    const s = useStore.getState();
    s.set({ live: { ...s.live, active: true, status: "connecting", muted: false, talking: false } });
    this.ensureOutput(); // within the user gesture
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const sid = s.sid || "";
    const av = avatar ? `&avatar=${encodeURIComponent(avatar)}` : "";
    this.userStopped = false;
    this.lastError = "";
    this.ws = new WebSocket(`${proto}://${location.host}/ws/live?sid=${sid}${av}`);
    this.ws.onmessage = (e) => this.onMessage(JSON.parse(e.data));
    this.ws.onclose = (e) => this.cleanup(e.code === 1000 ? "ended" : `closed (${e.code})`);
    this.ws.onerror = () => this.cleanup("error");
  }

  private setStatus(status: string) {
    const s = useStore.getState();
    s.set({ live: { ...s.live, status } });
  }

  private async onMessage(msg: any) {
    const store = useStore.getState();
    if (msg.type === "ready") {
      this.setStatus("listening");
      await this.startMic();
      return;
    }
    if (msg.type === "error") {
      this.lastError = msg.message || "Live avatar error";
      store.pushToast(this.lastError);
      return; // let the ws close drive cleanup so we don't double-toast
    }
    if (msg.type === "ui_command") {
      store.applyCommand(msg.command, msg.args);
      return;
    }
    const sc = msg.serverContent;
    if (sc?.interrupted) { this.stopPlayback(); this.setStatus("listening"); return; }
    // avatar media (audio is muxed into the MP4)
    const parts = sc?.modelTurn?.parts;
    if (parts) {
      for (const p of parts) {
        if (!p.inlineData) continue;
        const mime = p.inlineData.mimeType || "";
        if (mime.startsWith("video/mp4")) this.appendVideo(p.inlineData.data);
        else if (mime.startsWith("audio/pcm")) this.playPcm(p.inlineData.data);
      }
    }
    // shopper's speech transcript (accumulate; pushed to chat as a user line)
    const it = sc?.inputTranscription?.text;
    if (it) this.ibuf += it;
    // avatar's speech transcript (subtitle overlay + chat)
    const ot = sc?.outputTranscription?.text;
    if (ot) { this.setStatus("speaking"); this.appendTranscript(ot); }
    if (sc?.turnComplete) {
      this.flushTranscript();
      this.setStatus("listening");
    }
  }

  // --- transcript accumulation (full two-sided) ---
  private tbuf = "";   // avatar (output)
  private ibuf = "";   // shopper (input)
  private appendTranscript(t: string) {
    this.tbuf += t;
    const s = useStore.getState();
    s.set({ live: { ...s.live, caption: this.tbuf } });
  }
  private flushTranscript() {
    const store = useStore.getState();
    const u = this.ibuf.trim();
    const a = this.tbuf.trim();
    if (u) store.pushChat({ role: "user", text: u });       // what the shopper said
    if (a) store.pushChat({ role: "assistant", text: a });  // what the stylist said
    this.ibuf = ""; this.tbuf = "";
    store.set({ live: { ...store.live, caption: "" } });
  }

  sendText(text: string) {
    this.ws?.send(JSON.stringify({ realtimeInput: { text } }));
  }

  // ---------- mic capture (16kHz PCM) ----------
  private async startMic() {
    if (this.stream) return;
    this.ensureOutput();
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.inCtx = new AudioContext({ sampleRate: 16000 });
    this.srcNode = this.inCtx.createMediaStreamSource(this.stream);
    this.proc = this.inCtx.createScriptProcessor(512, 1, 1);
    this.proc.onaudioprocess = (e) => {
      if (this.muted) return; // PTT (manual VAD): only stream between activityStart and activityEnd
      const f32 = e.inputBuffer.getChannelData(0);
      const i16 = new Int16Array(f32.length);
      for (let i = 0; i < f32.length; i++) i16[i] = Math.max(-1, Math.min(1, f32[i])) * 32767;
      this.ws?.send(JSON.stringify({
        realtimeInput: { mediaChunks: [{ data: bytesToB64(new Uint8Array(i16.buffer)), mimeType: "audio/pcm;rate=16000" }] },
      }));
    };
    this.srcNode.connect(this.proc);
    this.proc.connect(this.inCtx.destination);
  }


  private pcmCount = 0;
  private playPcm(b64: string) {
    this.ensureOutput();
    if (!this.outCtx || !this.gain) return;
    if (this.pcmCount++ === 0) console.log("[live] receiving PCM audio; outCtx state:", this.outCtx.state);
    const ctx = this.outCtx;
    const bytes = b64ToBytes(b64);
    const i16 = new Int16Array(bytes.buffer);
    const buf = ctx.createBuffer(1, i16.length, 24000);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < i16.length; i++) ch[i] = i16[i] / 32768;
    if (this.nextStart - ctx.currentTime > 0.5) {
      this.nextStart = ctx.currentTime;
      this.sources.forEach((s) => { try { s.stop(); } catch {} s.disconnect(); });
      this.sources.clear();
    } else {
      this.nextStart = Math.max(this.nextStart, ctx.currentTime);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(this.gain);
    src.addEventListener("ended", () => this.sources.delete(src));
    src.start(this.nextStart);
    this.nextStart += buf.duration;
    this.sources.add(src);
  }

  // ---------- MSE video ----------
  private appendVideo(b64: string) {
    const bytes = b64ToBytes(b64).buffer;
    if (!this.initSeg) this.initSeg = bytes;
    if (!this.ms) this.initMSE();
    this.enqueue(bytes);
  }

  private initMSE() {
    const ms = new MediaSource();
    this.ms = ms;
    this.video.src = URL.createObjectURL(ms);
    ms.addEventListener("sourceopen", () => {
      const type = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
      const sb = MediaSource.isTypeSupported(type) ? ms.addSourceBuffer(type) : ms.addSourceBuffer("video/mp4");
      sb.mode = "sequence";
      this.sb = sb;
      if (this.initSeg && this.queue[0] !== this.initSeg) this.queue.unshift(this.initSeg);
      sb.addEventListener("updateend", () => {
        if (this.video.paused) this.video.play().catch(() => {});
        if (!sb.updating && this.video.currentTime > 2 && this.video.buffered.length > 0) {
          try {
            const start = this.video.buffered.start(0);
            const removeEnd = this.video.currentTime - 1;
            if (removeEnd > start) { sb.remove(start, removeEnd); return; }
          } catch {}
        }
        this.drain();
      });
      this.drain();
    });
    this.video.addEventListener("error", () => { this.ms = null; this.sb = null; this.queue = []; }, { once: true });
  }

  private enqueue(buf: ArrayBuffer) {
    const sb = this.sb;
    if (sb && !sb.updating && this.queue.length === 0) {
      try { sb.appendBuffer(buf); return; } catch { /* fallthrough */ }
    }
    this.queue.push(buf);
  }
  private drain() {
    const sb = this.sb;
    if (!sb || sb.updating || this.queue.length === 0) return;
    try { sb.appendBuffer(this.queue.shift()!); } catch {}
  }

  private startRenderLoop() {
    const loop = () => {
      const v = this.video;
      if (v.readyState >= 2 && !v.paused && v.videoWidth > 0) {
        if (this.canvas.width !== v.videoWidth || this.canvas.height !== v.videoHeight) {
          this.canvas.width = v.videoWidth;
          this.canvas.height = v.videoHeight;
        }
        this.ctx.drawImage(v, 0, 0);
        if (v.buffered.length > 0) {
          const edge = v.buffered.end(v.buffered.length - 1);
          if (edge - v.currentTime > 0.5) v.currentTime = edge - 0.25;
        }
      }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.userStopped = true;
    this.ws?.close(1000);
    this.cleanup("ended");
  }

  private cleanup(status: string) {
    if (!this.ws && !this.inCtx) return; // already cleaned
    cancelAnimationFrame(this.raf);
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    try { this.proc?.disconnect(); this.srcNode?.disconnect(); } catch {}
    this.sources.forEach((s) => { try { s.stop(); } catch {} });
    this.sources.clear();
    try { this.inCtx?.close(); this.outCtx?.close(); } catch {}
    this.inCtx = this.outCtx = null;
    try { this.video.pause(); this.video.removeAttribute("src"); this.video.load(); this.video.remove(); } catch {}
    this.ws = null;
    const s = useStore.getState();
    s.set({ live: { ...s.live, active: false, status, muted: false, talking: false, caption: "" } });
    if (!this.userStopped) {
      s.pushToast(this.lastError || `Live session dropped (${status}). Tap Go Live to resume.`);
    }
  }
}
