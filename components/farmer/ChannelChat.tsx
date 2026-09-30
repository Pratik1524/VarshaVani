"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AnimatePresence } from "framer-motion";
import { REDIRECT_MS, RedirectSplash } from "./RedirectSplash";
import { SendHorizontal } from "lucide-react";
import type { Channel, Lang } from "@/types";
import { SmsThread, WhatsAppChat, type ChatMessage } from "@/components/gateway/ChatViews";
import { useAppStore, useActiveCrop } from "@/lib/store";
import { useFarmerData } from "@/hooks/useFarmerData";
import { useBackNav } from "@/hooks/useEmulator";
import { getAdvisory } from "@/lib/advisoryEngine";
import { buildSms, buildWhatsApp } from "@/lib/messageFormat";
import { renderMsg, translate } from "@/lib/i18n";
import { tx } from "@/lib/i18n/farmerExtras";
import { newId } from "@/lib/ids";

const REPLY_LANG: Record<string, Lang> = { "1": "hi", "2": "mr", "3": "en" };
const WHY = ["WHY", "?", "का", "क्यों"];
const now = () => new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });

const QUICK = [
  { v: "1", label: "1 हिंदी" },
  { v: "2", label: "2 मराठी" },
  { v: "3", label: "3 English" },
  { v: "?", label: "? Why" },
];

/**
 * One delivery channel, full screen: the farmer's own advisory as it arrives
 * on WhatsApp or by SMS. Reply 1 / 2 / 3 to switch language or WHY for the
 * explanation. Simulated: nothing leaves the browser.
 */
export function ChannelChat({ channel }: { channel: Channel }) {
  const appLang = useAppStore((s) => s.lang);
  const crops = useAppStore((s) => s.crops);
  const active = useActiveCrop();
  const { block, data } = useFarmerData();
  const goBack = useBackNav("/farmer");

  const [thread, setThread] = useState<ChatMessage[] | null>(null);
  const [chatLang, setChatLang] = useState<Lang | null>(null);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const lang = chatLang ?? appLang;
  const [redirecting, setRedirecting] = useState(true);

  useEffect(() => {
    const id = window.setTimeout(() => setRedirecting(false), REDIRECT_MS);
    return () => window.clearTimeout(id);
  }, []);

  // Active crop first; SMS sends one short message per crop.
  const ordered = useMemo(() => (active ? [active, ...crops.filter((c) => c.id !== active.id)] : crops), [active, crops]);

  const compose = (l: Lang): string[] => {
    if (!data || !block) return [];
    const list = channel === "whatsapp" ? ordered.slice(0, 1) : ordered;
    return list.map((c) => {
      const adv = getAdvisory(c.crop, c.stage, data.forecast, 1, { drivers: data.drivers, block });
      return channel === "whatsapp" ? buildWhatsApp(l, adv, block, data.forecast) : buildSms(l, adv, block);
    });
  };

  // Until the farmer replies, the thread follows the app language and crops.
  const initial: ChatMessage[] = compose(appLang).map((text, i) => ({ id: `init-${i}`, from: "bot", text, time: "09:30" }));
  const messages = thread ?? initial;

  const reply = (raw: string) => {
    const text = raw.trim();
    if (!text || !data || !block) return;
    const withUser: ChatMessage[] = [...messages, { id: newId("chat"), from: "user", text, time: now(), status: "read" }];
    setThread(withUser);
    setInput("");
    setTyping(true);

    const key = text.toUpperCase();
    let l = lang;
    let answers: string[];
    if (REPLY_LANG[key]) {
      l = REPLY_LANG[key];
      setChatLang(l);
      answers = compose(l);
    } else if (WHY.includes(key)) {
      const adv = active ? getAdvisory(active.crop, active.stage, data.forecast, 1, { drivers: data.drivers, block }) : null;
      answers = adv ? [`❓ ${translate(l, "common.why")}\n${adv.drivers.map((m) => `• ${renderMsg(l, m)}`).join("\n")}`] : [];
    } else {
      answers = [`${translate(l, "sms.menu")}\n? = ${translate(l, "common.why")}`];
    }

    window.setTimeout(() => {
      setTyping(false);
      setThread((cur) => [...(cur ?? withUser), ...answers.map((a) => ({ id: newId("chat"), from: "bot" as const, text: a, time: now() }))]);
    }, 800);
  };

  const wa = channel === "whatsapp";

  const footer = (
    <div className={`${wa ? "bg-[#ece5dd]" : "border-t border-line bg-white"} px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2`}>
      {typing && <p className="px-2 pb-1 text-[11px] italic text-muted">VarshaVani is typing…</p>}
      <div className="mb-1.5 flex flex-wrap gap-1">
        {QUICK.map((q) => (
          <button
            key={q.v}
            type="button"
            onClick={() => reply(q.v)}
            className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold transition ${
              wa ? "bg-white text-[#075e54] shadow-sm hover:bg-slate-50" : "border border-line-strong text-body hover:border-blue-400"
            }`}
          >
            {q.label}
          </button>
        ))}
      </div>
      <form
        className="flex items-center gap-1.5"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          reply(input);
        }}
      >
        <label htmlFor={`farmer-${channel}`} className="sr-only">
          Reply by {channel === "sms" ? "SMS" : "WhatsApp"}
        </label>
        <input
          id={`farmer-${channel}`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={40}
          placeholder={wa ? "Message" : "Text message"}
          className="min-h-10 flex-1 rounded-full border border-line-strong bg-white px-3.5 text-[13px] placeholder:text-slate-400"
        />
        <button
          type="submit"
          aria-label="Send reply"
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-white transition ${
            wa ? "bg-[#128c7e] hover:bg-[#0e7568]" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          <SendHorizontal className="h-4 w-4" aria-hidden />
        </button>
      </form>
    </div>
  );

  const back = tx(appLang, "back");
  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {wa ? (
        <WhatsAppChat messages={messages} footer={footer} onBack={goBack} backLabel={back} />
      ) : (
        <SmsThread messages={messages} footer={footer} onBack={goBack} backLabel={back} />
      )}
      {/* Brief "Redirecting to WhatsApp / SMS" hand-off over the chat. */}
      <AnimatePresence>{redirecting && <RedirectSplash key="splash" channel={channel} />}</AnimatePresence>
    </div>
  );
}
