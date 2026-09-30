"use client";

import { useMemo, useState } from "react";
import { Check, Flame, Megaphone, MessageCircle, MessageSquareText, Send, Users } from "lucide-react";
import type { Channel, CropId, GrowthStage, Lang } from "@/types";
import { BLOCKS, BLOCK_BY_ID, DISTRICTS } from "@/data/blocks";
import { CROPS, CROP_IDS, STAGES } from "@/data/crops";
import { getAllForecasts, getDrivers, sendCampaign } from "@/lib/forecastService";
import { getAdvisory } from "@/lib/advisoryEngine";
import { buildSms, buildWhatsApp } from "@/lib/messageFormat";
import { PRIORITY_THRESHOLD, priorityScore } from "@/lib/priority";
import { LANGS, translate } from "@/lib/i18n";
import { useAsync } from "@/hooks/useAsync";
import { useMessageLog } from "@/hooks/useCommunityData";
import { useAppStore } from "@/lib/store";
import { INSET } from "@/lib/ui";
import { Card, CardHeader, PageTitle, SectionHeading } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Select } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { CardSkeleton } from "@/components/ui/States";
import { PhoneMockup } from "@/components/gateway/PhoneMockup";
import { SmsThread, WhatsAppChat } from "@/components/gateway/ChatViews";
import { MessageLogTable } from "@/components/gateway/MessageLogTable";

export default function CampaignPage() {
  const { data: forecasts } = useAsync(getAllForecasts, "all-forecasts");
  const { data: drivers } = useAsync(getDrivers, "drivers");
  const { messages } = useMessageLog();
  const addMessage = useAppStore((s) => s.addMessage);
  const setStatus = useAppStore((s) => s.setMessageStatus);

  const [selected, setSelected] = useState<string[]>(["latur", "nilanga", "dharashiv"]);
  const [district, setDistrict] = useState("all");
  const [crop, setCrop] = useState<CropId>("soybean");
  const [stage, setStage] = useState<GrowthStage>("not_sown");
  const [lang, setLang] = useState<Lang>("mr");
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [sending, setSending] = useState(false);
  const [lastSent, setLastSent] = useState<string | null>(null);

  const visible = BLOCKS.filter((b) => district === "all" || b.district === district);
  const previewBlock = BLOCK_BY_ID[selected[0]];

  const advisories = useMemo(() => {
    if (!forecasts || !drivers) return [];
    return selected.map((id) => getAdvisory(crop, stage, forecasts[id], 1, { drivers, block: BLOCK_BY_ID[id] }));
  }, [forecasts, drivers, selected, crop, stage]);

  const preview = advisories[0];
  const previewText =
    preview && previewBlock && forecasts
      ? channel === "whatsapp"
        ? buildWhatsApp(lang, preview, previewBlock, forecasts[previewBlock.id])
        : buildSms(lang, preview, previewBlock)
      : "";
  const recipients = selected.reduce((s, id) => s + Math.round(BLOCK_BY_ID[id].farmers * 0.35), 0);

  const toggle = (id: string) => setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const selectPriority = () => {
    if (!forecasts) return;
    setSelected(BLOCKS.filter((b) => priorityScore(b, forecasts[b.id], 1) >= PRIORITY_THRESHOLD).map((b) => b.id));
  };

  const send = async () => {
    if (!preview || selected.length === 0) return;
    setSending(true);
    const log = await sendCampaign({ blockIds: selected, crop, lang, channel, preview: previewText.split("\n").slice(0, 3).join(" "), advisoryType: preview.type });
    addMessage(log);
    setSending(false);
    setLastSent(log.id);
    // Simulated gateway callbacks: queued -> sent -> delivered -> read
    window.setTimeout(() => setStatus(log.id, "sent"), 900);
    window.setTimeout(() => setStatus(log.id, "delivered"), 2200);
    if (channel === "whatsapp") window.setTimeout(() => setStatus(log.id, "read"), 4200);
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <PageTitle icon={Megaphone} title="Campaign composer" subtitle="Select blocks, crop and language → preview the auto-generated advisory → send (simulated gateway)" />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {/* Step 1: blocks */}
          <Card pad>
            <CardHeader
              title={`1. Blocks (${selected.length} selected)`}
              as="h2"
              action={
                <div className="flex flex-wrap gap-2">
                  <Button variant="danger" size="sm" onClick={selectPriority} icon={Flame}>
                    Select priority blocks
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setSelected([])}>
                    Clear
                  </Button>
                </div>
              }
            />
            <Field label="Filter by district" htmlFor="cp-district" className="mt-4 max-w-xs">
              <Select id="cp-district" value={district} onChange={(e) => setDistrict(e.target.value)}>
                <option value="all">All districts</option>
                {DISTRICTS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </Select>
            </Field>
            <fieldset className="mt-3">
              <legend className="sr-only">Blocks</legend>
              <div className="grid max-h-64 grid-cols-2 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
                {visible.map((b) => {
                  const score = forecasts ? priorityScore(b, forecasts[b.id], 1) : 0;
                  const on = selected.includes(b.id);
                  return (
                    <label
                      key={b.id}
                      className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-control border px-2.5 text-[13px] transition ${
                        on ? "border-leaf-500 bg-leaf-50 text-leaf-900" : "border-line bg-white hover:border-line-strong"
                      }`}
                    >
                      <input type="checkbox" checked={on} onChange={() => toggle(b.id)} className="h-4 w-4 shrink-0 accent-leaf-700" />
                      <span className="flex-1 truncate font-medium">{b.name}</span>
                      {score >= PRIORITY_THRESHOLD && <Flame className="h-3.5 w-3.5 shrink-0 text-red-600" aria-label="priority" />}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </Card>

          {/* Step 2: content */}
          <Card pad>
            <CardHeader title="2. Crop, stage, language & channel" as="h2" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Crop" htmlFor="cp-crop">
                <Select id="cp-crop" value={crop} onChange={(e) => setCrop(e.target.value as CropId)}>
                  {CROP_IDS.map((c) => (
                    <option key={c} value={c}>
                      {CROPS[c].emoji} {translate("en", `crop.${c}`)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Growth stage" htmlFor="cp-stage">
                <Select id="cp-stage" value={stage} onChange={(e) => setStage(e.target.value as GrowthStage)}>
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {translate("en", `stage.${s}`)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Language">
                <Segmented<Lang> label="Message language" value={lang} onChange={setLang} options={LANGS.map((l) => ({ value: l.code, label: l.label }))} />
              </Field>
              <Field label="Channel">
                <Segmented<Channel>
                  label="Channel"
                  value={channel}
                  onChange={setChannel}
                  options={[
                    { value: "whatsapp", label: <><MessageCircle className="h-4 w-4" aria-hidden /> WhatsApp</> },
                    { value: "sms", label: <><MessageSquareText className="h-4 w-4" aria-hidden /> SMS</> },
                  ]}
                />
              </Field>
            </div>
          </Card>

          {/* Step 3: per-block summary */}
          <Card pad>
            <CardHeader title="3. Auto-generated advisory per block (week 1)" subtitle="From the advisory rules engine. Each block gets its own message." as="h2" />
            {!forecasts ? (
              <div className="mt-4">
                <CardSkeleton lines={3} />
              </div>
            ) : selected.length === 0 ? (
              <p className="mt-4 text-[13px] text-muted">Select at least one block.</p>
            ) : (
              <ul className="mt-4 divide-y divide-line">
                {advisories.map((a) => (
                  <li key={a.blockId} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-[13px]">
                    <span className="font-semibold text-ink">{BLOCK_BY_ID[a.blockId].name}</span>
                    <span className="flex-1 px-2 text-body">{translate(lang, a.action.key, a.action.params)}</span>
                    <RiskBadge level={a.severity} size="sm" label={translate("en", `type.${a.type}`)} />
                  </li>
                ))}
              </ul>
            )}
            <div className={`mt-4 flex flex-wrap items-center justify-between gap-3 p-3 ${INSET}`}>
              <p className="flex items-center gap-2 text-[13px] text-body">
                <Users className="h-4 w-4 text-muted" aria-hidden /> Est. recipients:{" "}
                <strong className="tabular-nums text-ink">{recipients.toLocaleString("en-IN")}</strong> registered farmers
              </p>
              <Button size="lg" onClick={send} disabled={sending || selected.length === 0 || !preview} icon={Send}>
                {sending ? "Sending…" : `Send via ${channel === "whatsapp" ? "WhatsApp" : "SMS"}`}
              </Button>
            </div>
            {lastSent && (
              <p role="status" className="mt-2.5 flex items-center gap-1.5 text-[13px] font-medium text-leaf-700">
                <Check className="h-4 w-4 shrink-0" aria-hidden /> Campaign queued at the simulated gateway. Watch the status update in the log below.
              </p>
            )}
          </Card>
        </div>

        {/* Preview */}
        <div className="xl:sticky xl:top-20 xl:self-start">
          <PhoneMockup label={`Preview · ${previewBlock?.name ?? "—"} · ${channel === "whatsapp" ? "WhatsApp" : "SMS"}`}>
            {channel === "whatsapp" ? (
              <WhatsAppChat messages={previewText ? [{ id: "p", from: "bot", text: previewText, time: "09:30" }] : []} />
            ) : (
              <SmsThread messages={previewText ? [{ id: "p", from: "bot", text: previewText, time: "09:30" }] : []} />
            )}
          </PhoneMockup>
        </div>
      </div>

      <section aria-labelledby="log">
        <SectionHeading id="log" title="Message log" description="Simulated gateway callbacks: queued → sent → delivered → read" />
        <MessageLogTable messages={messages} />
      </section>
    </div>
  );
}
