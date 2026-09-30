"use client";

import { useMemo, useState, type FormEvent } from "react";
import { MessageCircle, RotateCcw, SendHorizontal } from "lucide-react";
import type { Channel, CropId, Lang, MessageLog } from "@/types";
import { PageShell } from "@/components/layout/PageShell";
import { MUTED } from "@/lib/ui";
import { NoteChip, PageTitle, SectionHeading } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Select } from "@/components/ui/Field";
import { CardSkeleton } from "@/components/ui/States";
import { PhoneMockup } from "@/components/gateway/PhoneMockup";
import { SmsThread, WhatsAppChat, type ChatMessage } from "@/components/gateway/ChatViews";
import { MessageLogTable } from "@/components/gateway/MessageLogTable";
import { useAsync } from "@/hooks/useAsync";
import { useMessageLog } from "@/hooks/useCommunityData";
import { useAppStore } from "@/lib/store";
import { getDrivers, getForecast } from "@/lib/forecastService";
import { getAdvisory } from "@/lib/advisoryEngine";
import { buildSms, buildWhatsApp } from "@/lib/messageFormat";
import { renderMsg, translate } from "@/lib/i18n";
import { newId } from "@/lib/ids";
import { BLOCKS, BLOCK_BY_ID } from "@/data/blocks";
import { CROPS, CROP_IDS } from "@/data/crops";

const REPLY_LANG: Record<string, Lang> = { "1": "hi", "2": "mr", "3": "en" };
const now = () => new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });

/**
 * Interactive mock of the SMS / WhatsApp gateway. The farmer can reply
 * 1 / 2 / 3 to switch language or "WHY" for the explanation; the bot answers
 * with text generated from the same advisory engine as the app.
 */
export default function GatewayPage() {
  const appLang = useAppStore((s) => s.lang);
  const homeBlock = useAppStore((s) => s.blockId);
  const addMessage = useAppStore((s) => s.addMessage);
  const setStatus = useAppStore((s) => s.setMessageStatus);
  const { messages: log } = useMessageLog();

  const [blockId, setBlockId] = useState(homeBlock);
  const [crop, setCrop] = useState<CropId>("soybean");
  const [threads, setThreads] = useState<Record<Channel, ChatMessage[]> | null>(null);
  const [typing, setTyping] = useState<Channel | null>(null);
  const [input, setInput] = useState<Record<Channel, string>>({ whatsapp: "", sms: "" });
  const [chatLang, setChatLang] = useState<Record<Channel, Lang | null>>({ whatsapp: null, sms: null });

  const block = BLOCK_BY_ID[blockId];
  const forecast = useAsync(() => getForecast(blockId), `gw:${blockId}`);
  const drivers = useAsync(getDrivers, "drivers");

  const advisory = useMemo(
    () => (forecast.data && drivers.data && forecast.data.blockId === blockId ? getAdvisory(crop, "not_sown", forecast.data, 1, { drivers: drivers.data, block }) : null),
    [forecast.data, drivers.data, blockId, crop, block],
  );

  const compose = (channel: Channel, lang: Lang) =>
    advisory && forecast.data ? (channel === "whatsapp" ? buildWhatsApp(lang, advisory, block, forecast.data) : buildSms(lang, advisory, block)) : "";

  const nextId = () => newId("chat");

  // The initial thread is derived until the user interacts, so it always
  // reflects the chosen block / crop / app language.
  const initial = (channel: Channel): ChatMessage[] => (advisory ? [{ id: `init-${channel}`, from: "bot", text: compose(channel, appLang), time: "09:30" }] : []);
  const thread = (channel: Channel) => threads?.[channel] ?? initial(channel);

  const logDelivery = (channel: Channel, lang: Lang, text: string) => {
    if (!advisory) return;
    const entry: MessageLog = {
      id: newId(`gw-${channel}`),
      timestamp: new Date().toISOString(),
      channel,
      lang,
      blockIds: [blockId],
      crop,
      recipients: 1,
      status: "sent",
      preview: text.slice(0, 120),
      advisoryType: advisory.type,
    };
    addMessage(entry);
    window.setTimeout(() => setStatus(entry.id, "delivered"), 900);
    if (channel === "whatsapp") window.setTimeout(() => setStatus(entry.id, "read"), 2200);
  };

  const reply = (channel: Channel, raw: string) => {
    const text = raw.trim();
    if (!text || !advisory) return;
    const base = threads ?? { whatsapp: initial("whatsapp"), sms: initial("sms") };
    const withUser = { ...base, [channel]: [...base[channel], { id: nextId(), from: "user" as const, text, time: now(), status: "read" as const }] };
    setThreads(withUser);
    setInput((s) => ({ ...s, [channel]: "" }));
    setTyping(channel);

    const key = text.toUpperCase();
    let lang: Lang = chatLang[channel] ?? appLang;
    let answer: string;
    if (REPLY_LANG[key]) {
      lang = REPLY_LANG[key];
      setChatLang((s) => ({ ...s, [channel]: lang }));
      answer = compose(channel, lang);
    } else if (key === "WHY" || key === "?" || key === "का" || key === "क्यों") {
      answer = `❓ ${translate(lang, "common.why")}\n${advisory.drivers.map((m) => `• ${renderMsg(lang, m)}`).join("\n")}`;
    } else {
      answer = `${translate(lang, "sms.menu")}\n? = ${translate(lang, "common.why")}`;
    }
    window.setTimeout(() => {
      setTyping(null);
      setThreads((cur) => {
        const c = cur ?? withUser;
        return { ...c, [channel]: [...c[channel], { id: nextId(), from: "bot", text: answer, time: now() }] };
      });
      logDelivery(channel, lang, answer);
    }, 800);
  };

  const quick = [
    { v: "1", label: "1 हिंदी" },
    { v: "2", label: "2 मराठी" },
    { v: "3", label: "3 English" },
    { v: "?", label: "? Why" },
  ];

  const composer = (channel: Channel) => (
    <div className={channel === "whatsapp" ? "bg-[#ece5dd] p-2" : "border-t border-line bg-white p-2"}>
      {typing === channel && <p className="px-2 pb-1 text-[11px] italic text-muted">VarshaVani is typing…</p>}
      <div className="mb-1.5 flex flex-wrap gap-1">
        {quick.map((q) => (
          <button
            key={q.v}
            type="button"
            onClick={() => reply(channel, q.v)}
            className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold transition ${
              channel === "whatsapp" ? "bg-white text-[#075e54] shadow-sm hover:bg-slate-50" : "border border-line-strong text-body hover:border-leaf-400"
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
          reply(channel, input[channel]);
        }}
      >
        <label htmlFor={`in-${channel}`} className="sr-only">
          Reply by {channel}
        </label>
        <input
          id={`in-${channel}`}
          value={input[channel]}
          onChange={(e) => setInput((s) => ({ ...s, [channel]: e.target.value }))}
          maxLength={40}
          placeholder="Type 1, 2, 3 or WHY"
          className="min-h-10 flex-1 rounded-full border border-line-strong bg-white px-3.5 text-[13px] placeholder:text-slate-400"
        />
        <button
          type="submit"
          aria-label="Send reply"
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-white transition ${
            channel === "whatsapp" ? "bg-[#128c7e] hover:bg-[#0e7568]" : "bg-monsoon-700 hover:bg-monsoon-800"
          }`}
        >
          <SendHorizontal className="h-4 w-4" aria-hidden />
        </button>
      </form>
    </div>
  );

  return (
    <PageShell>
      <PageTitle
        icon={MessageCircle}
        title="SMS / WhatsApp gateway simulator"
        subtitle="The same advisory, delivered to feature phones (SMS) and smartphones (WhatsApp)."
        action={<NoteChip>Simulated · no messages leave the browser</NoteChip>}
      />

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <Field label="Block" htmlFor="gw-block" className="w-52">
          <Select
            id="gw-block"
            value={blockId}
            onChange={(e) => {
              setBlockId(e.target.value);
              setThreads(null);
            }}
          >
            {BLOCKS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.district})
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Crop" htmlFor="gw-crop" className="w-44">
          <Select
            id="gw-crop"
            value={crop}
            onChange={(e) => {
              setCrop(e.target.value as CropId);
              setThreads(null);
            }}
          >
            {CROP_IDS.map((c) => (
              <option key={c} value={c}>
                {CROPS[c].emoji} {translate("en", `crop.${c}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Button
          variant="secondary"
          icon={RotateCcw}
          onClick={() => {
            setThreads(null);
            setChatLang({ whatsapp: null, sms: null });
          }}
        >
          Restart chats
        </Button>
        <p className={`pb-2 ${MUTED}`}>Initial language follows the header switcher. Reply 1 / 2 / 3 to change it.</p>
      </div>

      {!advisory ? (
        <div className="grid gap-6 md:grid-cols-2">
          <CardSkeleton lines={10} />
          <CardSkeleton lines={10} />
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2">
          <PhoneMockup label="WhatsApp (smartphone)">
            <WhatsAppChat messages={thread("whatsapp")} footer={composer("whatsapp")} />
          </PhoneMockup>
          <PhoneMockup label="SMS (any phone)">
            <SmsThread messages={thread("sms")} footer={composer("sms")} />
          </PhoneMockup>
        </div>
      )}

      <section aria-labelledby="gw-log" className="mt-8">
        <SectionHeading id="gw-log" title="Gateway delivery log" description="Every simulated send, with its delivery status" />
        <MessageLogTable messages={log} limit={15} />
      </section>
    </PageShell>
  );
}
