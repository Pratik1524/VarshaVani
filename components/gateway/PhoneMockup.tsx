import type { ReactNode } from "react";
import { BatteryFull, Signal, Wifi } from "lucide-react";

/** Phone frame used for SMS / WhatsApp previews. */
export function PhoneMockup({ children, label, dark = false }: { children: ReactNode; label: string; dark?: boolean }) {
  return (
    <figure aria-label={label} className="mx-auto w-full max-w-[330px]">
      <div className="rounded-[2.4rem] bg-monsoon-950 p-2.5 shadow-lift">
        <div className={`relative flex h-[600px] flex-col overflow-hidden rounded-[1.9rem] ${dark ? "bg-monsoon-950" : "bg-white"}`}>
          <div className={`flex items-center justify-between px-6 pb-1 pt-2.5 text-[10.5px] font-semibold ${dark ? "text-white" : "text-ink"}`}>
            <span>09:30</span>
            <span className="absolute left-1/2 top-2 h-4.5 w-20 -translate-x-1/2 rounded-full bg-monsoon-950" aria-hidden />
            <span className="flex items-center gap-1" aria-hidden>
              <Signal className="h-3 w-3" />
              <Wifi className="h-3 w-3" />
              <BatteryFull className="h-3.5 w-3.5" />
            </span>
          </div>
          {children}
        </div>
      </div>
      <figcaption className="mt-2.5 text-center text-[12.5px] font-semibold text-muted">{label}</figcaption>
    </figure>
  );
}

/** Render WhatsApp-style *bold* and _italic_ markup safely (no HTML injection). */
export function WaText({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, li) => (
        <span key={li} className="block min-h-[1em]">
          {line.split(/(\*[^*]+\*|_[^_]+_)/g).map((part, pi) => {
            if (/^\*[^*]+\*$/.test(part)) return <strong key={pi}>{part.slice(1, -1)}</strong>;
            if (/^_[^_]+_$/.test(part)) return <em key={pi}>{part.slice(1, -1)}</em>;
            return <span key={pi}>{part}</span>;
          })}
        </span>
      ))}
    </>
  );
}
