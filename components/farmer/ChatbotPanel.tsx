"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { create } from "zustand";
import { ArrowLeft, Mic, SendHorizontal, Square, Volume2, X } from "lucide-react";
import type { Lang } from "@/types";
import { LogoMark } from "@/components/ui/Logo";
import { Segmented } from "@/components/ui/Segmented";
import { WaText } from "@/components/gateway/PhoneMockup";
import { useAppStore, useActiveCrop } from "@/lib/store";
import { useFarmerData } from "@/hooks/useFarmerData";
import { useSpeech } from "@/hooks/useSpeech";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { answer } from "@/lib/chatbot";
import { LANGS, translate } from "@/lib/i18n";
import { tx, type ExtraKey } from "@/lib/i18n/farmerExtras";
import { blockName } from "@/data/blocks";
import { newId } from "@/lib/ids";

interface BotMessage {
  id: string;
  from: "bot" | "user";
  text: string;
  time: string;
  lang: Lang;
  voice?: boolean;
}

/** Chat history lives for the session (survives closing the panel / changing page). */
const useChat = create<{
  messages: BotMessage[];
  lang: Lang | null;
  add: (m: BotMessage) => void;
  setLang: (l: Lang) => void;
}>((set) => ({
  messages: [],
  lang: null,
  add: (m) => set((s) => ({ messages: [...s.messages, m] })),
  setLang: (lang) => set({ lang }),
}));

const SUGGESTIONS: ExtraKey[] = ["botSuggest1", "botSuggest2", "botSuggest3", "botSuggest4", "botSuggest5", "botSuggest6"];

const now = () => new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });

/** Plain text for the speech engine: no markup, bullets or emoji. */
const speakable = (text: string) =>
  text
    .replace(/[*_•]/g, "")
    .replace(/[\p{Extended_Pictographic}\u200d\uFE0F]/gu, "")
    .replace(/\n+/g, ". ")
    .replace(/\s{2,}/g, " ")
    .trim();

/**
 * Full-screen assistant sheet for the farmer app: typed or voice questions,
 * answers read aloud on request, and its own language switch.
 */
export function ChatbotPanel({ onClose }: { onClose: () => void }) {
  const appLang = useAppStore((s) => s.lang);
  const user = useAppStore((s) => s.user);
  const crops = useAppStore((s) => s.crops);
  const activeCrop = useActiveCrop();
  const { block, data } = useFarmerData();
  const { messages, add, lang: chosenLang, setLang } = useChat();
  const lang = chosenLang ?? appLang;
  const langLabel = LANGS.find((l) => l.code === lang)!.label;

  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const { speak, stop, status, activeId } = useSpeech();
  const scroller = useRef<HTMLDivElement>(null);
  const backBtn = useRef<HTMLButtonElement>(null);
  const timer = useRef<number | undefined>(undefined);

  const send = useCallback(
    (raw: string, voice = false) => {
      const text = raw.trim();
      if (!text) return;
      add({ id: newId("u"), from: "user", text, time: now(), lang, voice });
      setInput("");
      setTyping(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        const reply =
          data && block
            ? answer(text, lang, { forecast: data.forecast, drivers: data.drivers, block, crops, activeCrop })
            : translate(lang, "common.loading");
        const id = newId("b");
        add({ id, from: "bot", text: reply, time: now(), lang });
        setTyping(false);
        // Voice in, voice out.
        if (voice) speak(id, speakable(reply), lang);
      }, 750);
    },
    [add, lang, data, block, crops, activeCrop, speak],
  );

  const voice = useVoiceInput(lang, (text) => send(text, true));

  // Keep the newest message in view.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, typing]);

  // Focus into the sheet, close on Escape, clean up on unmount.
  useEffect(() => {
    backBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(timer.current);
    };
  }, [onClose]);

  const close = () => {
    stop();
    voice.cancel();
    onClose();
  };

  const changeLang = (l: Lang) => {
    if (l === lang) return;
    stop();
    voice.cancel();
    setLang(l);
    add({ id: newId("b"), from: "bot", text: tx(l, "botLangChanged"), time: now(), lang: l });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const errorText =
    voice.error === "unsupported"
      ? tx(lang, "botVoiceUnsupported")
      : voice.error === "denied"
        ? tx(lang, "botMicDenied")
        : voice.error
          ? tx(lang, "botNoSpeech")
          : status === "unavailable" && activeId
            ? translate(lang, "voice.unavailable")
            : null;

  const firstName = user?.name.split(" ")[0] ?? "";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bot-title"
      className="fixed inset-0 z-[1600] flex animate-slide-up flex-col bg-canvas"
    >
      {/* Header */}
      <header className="flex shrink-0 items-center gap-2 border-b border-line bg-white px-2 py-2">
        <button
          ref={backBtn}
          type="button"
          onClick={close}
          aria-label={tx(lang, "back")}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink transition hover:bg-slate-100"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </button>
        <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-leaf-50 ring-1 ring-leaf-100">
          <LogoMark className="h-5.5 w-5.5" />
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <h2 id="bot-title" className="truncate text-[14px] font-bold">
            {tx(lang, "botName")}
          </h2>
          <p className="truncate text-[11.5px] text-muted">{tx(lang, "botStatus", { lang: langLabel })}</p>
        </div>
        <Segmented
          size="sm"
          label={translate(lang, "lang.label")}
          value={lang}
          onChange={changeLang}
          options={LANGS.map((l) => ({ value: l.code, label: l.short, ariaLabel: l.label }))}
        />
      </header>

      {/* Conversation */}
      <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto px-3 py-4" aria-live="polite">
        <div className="rounded-card border border-line bg-white p-3.5 shadow-soft">
          <p className="text-[13.5px] leading-relaxed text-body">
            {tx(lang, "botWelcome", { name: firstName, block: blockName(block, lang) })}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {SUGGESTIONS.slice(0, 4).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => send(tx(lang, k))}
                className="rounded-full border border-leaf-200 bg-leaf-50 px-3 py-1.5 text-[12.5px] font-semibold text-leaf-800 transition hover:border-leaf-400 hover:bg-leaf-100"
              >
                {tx(lang, k)}
              </button>
            ))}
          </div>
        </div>

        {messages.map((m) =>
          m.from === "user" ? (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[82%] animate-pop rounded-2xl rounded-br-md bg-leaf-700 px-3.5 py-2 text-[13.5px] leading-snug text-white shadow-soft">
                {m.voice && (
                  <span className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-leaf-100">
                    <Mic className="h-3.5 w-3.5" aria-hidden />
                    {tx(m.lang, "botVoiceMessage")}
                    <span className="flex h-3 items-end gap-0.5" aria-hidden>
                      {[3, 7, 5, 9, 4, 8, 6].map((h, i) => (
                        <span key={i} className="w-0.5 rounded-full bg-leaf-200" style={{ height: `${h + 3}px` }} />
                      ))}
                    </span>
                  </span>
                )}
                <span className="block whitespace-pre-wrap break-words">{m.text}</span>
                <span className="mt-0.5 block text-right text-[10px] text-leaf-100">{m.time}</span>
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex items-end gap-2">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-leaf-50 ring-1 ring-leaf-100">
                <LogoMark className="h-4 w-4" />
              </span>
              <div className="max-w-[82%] animate-pop rounded-2xl rounded-bl-md border border-line bg-white px-3.5 py-2 text-[13.5px] leading-snug text-body shadow-soft">
                <WaText text={m.text} />
                <span className="mt-1.5 flex items-center justify-between gap-3 text-[10px] text-muted">
                  <button
                    type="button"
                    onClick={() => (activeId === m.id && status !== "idle" ? stop() : speak(m.id, speakable(m.text), m.lang))}
                    className="-ml-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-semibold text-leaf-700 transition hover:bg-leaf-50"
                    aria-pressed={activeId === m.id && status !== "idle"}
                  >
                    {activeId === m.id && (status === "speaking" || status === "fallback") ? (
                      <>
                        <Square className="h-3 w-3" aria-hidden /> {tx(m.lang, "botStop")}
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-3.5 w-3.5" aria-hidden /> {tx(m.lang, "botListen")}
                      </>
                    )}
                  </button>
                  {m.time}
                </span>
              </div>
            </div>
          ),
        )}

        {typing && (
          <div className="flex items-end gap-2" role="status" aria-label={tx(lang, "botTyping")}>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-leaf-50 ring-1 ring-leaf-100">
              <LogoMark className="h-4 w-4" />
            </span>
            <span className="flex gap-1 rounded-2xl rounded-bl-md border border-line bg-white px-3.5 py-3 shadow-soft">
              {[0, 150, 300].map((d) => (
                <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${d}ms` }} />
              ))}
            </span>
          </div>
        )}

        <p className="px-4 pt-1 text-center text-[10.5px] leading-snug text-muted">{tx(lang, "botDisclaimer")}</p>
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-line bg-white px-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] pt-2">
        {errorText && (
          <p role="alert" className="mb-2 flex items-start gap-2 rounded-control bg-red-50 px-3 py-2 text-[12px] font-medium text-red-800">
            <span className="flex-1">{errorText}</span>
            <button type="button" onClick={voice.clearError} aria-label={translate(lang, "common.close")} className="shrink-0">
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          </p>
        )}

        {voice.listening ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={voice.cancel}
              aria-label={tx(lang, "botCancel")}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted transition hover:bg-slate-100 hover:text-ink"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
            <div className="min-w-0 flex-1 rounded-2xl bg-red-50 px-3.5 py-2" aria-live="polite">
              <p className="flex items-center gap-2 text-[12px] font-semibold text-red-700">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
                </span>
                {tx(lang, "botListening", { lang: langLabel })}
              </p>
              {voice.interim && <p className="mt-0.5 truncate text-[13px] text-body">{voice.interim}</p>}
            </div>
            <button
              type="button"
              onClick={voice.stop}
              aria-label={tx(lang, "botStopListening")}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-leaf-700 text-white shadow-soft transition hover:bg-leaf-800"
            >
              <SendHorizontal className="h-4.5 w-4.5" aria-hidden />
            </button>
          </div>
        ) : (
          <>
            <div className="no-scrollbar -mx-2.5 mb-2 flex gap-1.5 overflow-x-auto px-2.5">
              {SUGGESTIONS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => send(tx(lang, k))}
                  className="shrink-0 rounded-full border border-line-strong bg-white px-3 py-1.5 text-[12px] font-semibold text-body transition hover:border-leaf-400 hover:text-leaf-800"
                >
                  {tx(lang, k)}
                </button>
              ))}
            </div>
            <form onSubmit={onSubmit} className="flex items-center gap-2">
              <label htmlFor="bot-input" className="sr-only">
                {tx(lang, "botPlaceholder")}
              </label>
              <input
                id="bot-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={300}
                autoComplete="off"
                placeholder={tx(lang, "botPlaceholder")}
                className="min-h-11 min-w-0 flex-1 rounded-full border border-line-strong bg-slate-50 px-4 text-[14px] text-ink placeholder:text-slate-400 focus:bg-white"
              />
              {input.trim() ? (
                <button
                  type="submit"
                  aria-label={tx(lang, "botSend")}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-leaf-700 text-white shadow-soft transition hover:bg-leaf-800"
                >
                  <SendHorizontal className="h-4.5 w-4.5" aria-hidden />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    stop();
                    voice.start();
                  }}
                  aria-label={tx(lang, "botMic")}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-leaf-700 text-white shadow-soft transition hover:bg-leaf-800"
                >
                  <Mic className="h-5 w-5" aria-hidden />
                </button>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
