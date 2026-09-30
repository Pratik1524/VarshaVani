"use client";

import { useEffect, useRef } from "react";
import { ArrowLeft, Check, CheckCheck, Phone, Video } from "lucide-react";
import type { DeliveryStatus } from "@/types";
import { LogoMark } from "@/components/ui/Logo";
import { WaText } from "./PhoneMockup";

export interface ChatMessage {
  id: string;
  from: "bot" | "user";
  text: string;
  time: string;
  status?: DeliveryStatus;
}

/** Keep the newest message in view. */
function useAutoScroll(count: number) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [count]);
  return ref;
}

export function StatusTicks({ status, className = "h-4 w-4" }: { status?: DeliveryStatus; className?: string }) {
  if (!status || status === "queued") return <span className="text-[10px] text-slate-400">⏱</span>;
  if (status === "failed") return <span className="text-[10px] font-bold text-red-600">!</span>;
  if (status === "sent") return <Check className={`${className} text-slate-400`} aria-label="sent" />;
  return <CheckCheck className={`${className} ${status === "read" ? "text-sky-500" : "text-slate-400"}`} aria-label={status} />;
}

/** WhatsApp chat UI inside the phone frame. */
export function WhatsAppChat({
  messages,
  footer,
  onBack,
  backLabel = "Back",
}: {
  messages: ChatMessage[];
  footer?: React.ReactNode;
  /** Makes the header arrow a working back button. */
  onBack?: () => void;
  backLabel?: string;
}) {
  const scroller = useAutoScroll(messages.length);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 bg-[#075e54] px-3 py-2 text-white">
        {onBack ? (
          <button type="button" onClick={onBack} aria-label={backLabel} className="-ml-1 grid h-9 w-9 place-items-center rounded-full transition hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </button>
        ) : (
          <ArrowLeft className="h-5 w-5" aria-hidden />
        )}
        <LogoMark className="h-8 w-8" />
        <div className="flex-1 leading-tight">
          <p className="text-sm font-bold">VarshaVani ✓</p>
          <p className="text-[11px] text-green-100">Business account · simulated</p>
        </div>
        <Video className="h-5 w-5" aria-hidden />
        <Phone className="h-4.5 w-4.5" aria-hidden />
      </div>
      <div
        ref={scroller}
        className="flex-1 space-y-2 overflow-y-auto bg-[#ece5dd] p-3"
        aria-live="polite"
        style={{ backgroundImage: "radial-gradient(rgba(0,0,0,0.035) 1px, transparent 1px)", backgroundSize: "14px 14px" }}
      >
        <p className="mx-auto w-fit rounded-md bg-[#e1f3fb] px-2 py-0.5 text-[10px] text-slate-600">Messages are simulated in this prototype</p>
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] animate-pop rounded-lg px-2.5 py-1.5 text-[13px] leading-snug text-slate-900 shadow-sm ${
                m.from === "user" ? "rounded-tr-none bg-[#dcf8c6]" : "rounded-tl-none bg-white"
              }`}
            >
              <WaText text={m.text} />
              <span className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-slate-500">
                {m.time}
                {m.from === "user" && <StatusTicks status={m.status ?? "read"} className="h-3.5 w-3.5" />}
                {m.from === "bot" && m.status && <StatusTicks status={m.status} className="h-3.5 w-3.5" />}
              </span>
            </div>
          </div>
        ))}
      </div>
      {footer}
    </div>
  );
}

/** Plain SMS thread (feature-phone style). */
export function SmsThread({
  messages,
  footer,
  onBack,
  backLabel = "Back",
}: {
  messages: ChatMessage[];
  footer?: React.ReactNode;
  /** Adds a back button to the thread header. */
  onBack?: () => void;
  backLabel?: string;
}) {
  const scroller = useAutoScroll(messages.length);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative border-b border-slate-200 px-4 py-2 text-center">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel}
            className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-blue-600 transition hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </button>
        )}
        <p className="text-sm font-bold text-slate-900">MMITRA</p>
        <p className="text-[11px] text-slate-500">Text message · simulated</p>
      </div>
      <div ref={scroller} className="flex-1 space-y-2 overflow-y-auto bg-white p-3" aria-live="polite">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] animate-pop whitespace-pre-wrap rounded-2xl px-3 py-2 text-[13px] leading-snug ${
                m.from === "user" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-900"
              }`}
            >
              {m.text}
              <span className={`mt-0.5 block text-right text-[10px] ${m.from === "user" ? "text-blue-100" : "text-slate-400"}`}>{m.time}</span>
            </div>
          </div>
        ))}
      </div>
      {footer}
    </div>
  );
}
