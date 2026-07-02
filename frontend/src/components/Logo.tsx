// Cymbal Direct lockup — official assets from the brand deck:
//  • the gradient "D" subsidiary monogram (cymbal-direct-mark.png)
//  • the master "Cymbal" wordmark (cymbal-wordmark.png, ITC Avant Garde)
//  • "Direct" set in the brand gradient.
import { asset } from "../lib";

export function DirectMark({ size = 34, className = "" }: { size?: number; className?: string }) {
  return (
    <img src={asset("assets/brand/cymbal-direct-mark.png")} alt="Cymbal Direct"
      style={{ height: size }} className={`w-auto select-none ${className}`} draggable={false} />
  );
}

export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <DirectMark size={32} />
      {!compact && (
        <div className="leading-none">
          <div className="flex items-end gap-[5px]">
            <img src={asset("assets/brand/cymbal-wordmark.png")} alt="Cymbal"
              className="h-[15px] w-auto" draggable={false} />
            <span className="text-[16px] font-extrabold tracking-tight brand-text leading-none">Direct</span>
          </div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-stone-400 mt-1.5">Style Studio</p>
        </div>
      )}
    </div>
  );
}
