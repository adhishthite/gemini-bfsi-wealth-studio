import { Wand2, Sparkles, AlertCircle, ShoppingBag } from "lucide-react";
import Modal from "./Modal";
import { useStore } from "../store";
import { sendUserText } from "../ws";

export default function VtoModal() {
  const { vto, set } = useStore();
  const open = vto.status === "processing" || vto.status === "done" || vto.status === "error";
  const close = () => set({ vto: { status: "idle" } });

  return (
    <Modal open={open} onClose={close} maxW="max-w-2xl"
      dismissable={vto.status !== "processing"}
      title={vto.status === "done" ? "Your virtual try-on" : undefined}>
      <div className="px-6 pb-6">
        {vto.status === "processing" && (
          <div className="py-10 text-center">
            <div className="relative mx-auto h-20 w-20">
              <span className="absolute inset-0 rounded-full bg-brand-pink/30 animate-pulse-ring" />
              <div className="relative grid place-items-center h-20 w-20 rounded-full bg-brand-gradient text-white shadow-glass animate-float">
                <Wand2 size={30} />
              </div>
            </div>
            <h3 className="mt-5 text-lg font-bold text-brand-ink">Engaging virtual try-on agent…</h3>
            <p className="mt-1 text-sm text-stone-500">
              Styling {vto.names?.join(" + ") || "your look"} on you
              {vto.context ? ` for ${vto.context}` : ""}.
            </p>
            <div className="mt-4 mx-auto max-w-xs h-1.5 rounded-full bg-stone-200 overflow-hidden">
              <div className="h-full w-1/2 bg-brand-gradient rounded-full animate-[shimmer_1.6s_infinite]" />
            </div>
            <p className="mt-3 text-xs text-stone-400">Powered by Gemini 3 Pro Image · ~5–10s</p>
          </div>
        )}

        {vto.status === "done" && (
          <div className="animate-fade-up">
            <div className="relative rounded-xl2 overflow-hidden bg-stone-100 shadow-lift grid place-items-center">
              {/* cap height so the FULL figure + modal chrome fit the viewport (no head/feet crop) */}
              <img src={vto.image} alt="Virtual try-on result"
                className="mx-auto w-auto max-w-full max-h-[calc(100dvh-15rem)] object-contain" />
              <span className="absolute top-3 left-3 chip bg-white/85 text-brand-purple shadow">
                <Sparkles size={12} /> Gen-AI Try-On
              </span>
            </div>
            {vto.caption && <p className="mt-3 text-sm text-stone-600 text-center capitalize">{vto.caption}</p>}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={close} className="btn-ghost">Keep browsing</button>
              <button onClick={() => { close(); sendUserText("Looks great, let's check out"); }} className="btn-primary">
                <ShoppingBag size={15} /> Checkout this look
              </button>
            </div>
          </div>
        )}

        {vto.status === "error" && (
          <div className="py-8 text-center">
            <AlertCircle size={36} className="mx-auto text-amber-500" />
            <h3 className="mt-3 font-semibold text-brand-ink">Couldn't generate the try-on</h3>
            <p className="mt-1 text-sm text-stone-500">{vto.error}</p>
            <button onClick={close} className="btn-ghost mt-4">Close</button>
          </div>
        )}
      </div>
    </Modal>
  );
}
