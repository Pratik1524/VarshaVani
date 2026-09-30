"use client";

import { useState, type FormEvent } from "react";
import { Check, MapPin, Pencil, Plus, Sprout, Star, Trash2 } from "lucide-react";
import type { CropId, FarmerCrop, GrowthStage } from "@/types";
import { useAppStore } from "@/lib/store";
import { useT } from "@/hooks/useT";
import { useFarmerData } from "@/hooks/useFarmerData";
import { getAdvisory } from "@/lib/advisoryEngine";
import { BLOCKS, BLOCK_BY_ID, blockName } from "@/data/blocks";
import { CROPS, CROP_IDS, STAGES } from "@/data/crops";
import { fmtDate } from "@/lib/i18n";
import { newId } from "@/lib/ids";
import { Card, CardHeader, PageTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { EmptyState } from "@/components/ui/States";

type Draft = Omit<FarmerCrop, "id"> & { id?: string };
const EMPTY: Draft = { crop: "soybean", stage: "not_sown", areaAcres: 2 };

export default function CropsPage() {
  const { t, tm, lang } = useT();
  const crops = useAppStore((s) => s.crops);
  const activeId = useAppStore((s) => s.activeCropId);
  const { addCrop, updateCrop, removeCrop, setActiveCrop, setLocation } = useAppStore.getState();
  const blockId = useAppStore((s) => s.blockId);
  const village = useAppStore((s) => s.village);
  const { block, data } = useFarmerData();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saved, setSaved] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    const clean: Draft = {
      ...draft,
      areaAcres: Math.max(0.1, Math.min(500, Number(draft.areaAcres) || 1)),
      // A sowing date only makes sense once sowing has started.
      sowingDate: draft.stage === "not_sown" ? undefined : draft.sowingDate,
    };
    if (clean.id) updateCrop(clean as FarmerCrop);
    else addCrop({ ...clean, id: newId("c") });
    setDraft(null);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5">
      <PageTitle icon={Sprout} title={t("crops.title")} subtitle={t("crops.subtitle")} />

      {/* Location */}
      <Card pad>
        <CardHeader icon={MapPin} title={t("crops.profile")} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label={t("common.block")} htmlFor="loc-block">
            <Select id="loc-block" big value={blockId} onChange={(e) => setLocation(e.target.value, BLOCK_BY_ID[e.target.value].villages[0])}>
              {BLOCKS.map((b) => (
                <option key={b.id} value={b.id}>
                  {blockName(b, lang)} ({b.district})
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("common.village")} htmlFor="loc-village">
            <Select id="loc-village" big value={village} onChange={(e) => setLocation(blockId, e.target.value)}>
              {BLOCK_BY_ID[blockId]?.villages.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      {saved && (
        <p role="status" className="flex items-center gap-2 rounded-control border border-leaf-200 bg-leaf-50 px-3 py-2 text-[13px] font-semibold text-leaf-800">
          <Check className="h-4 w-4 shrink-0" aria-hidden /> {t("crops.saved")}
        </p>
      )}

      {/* List */}
      {crops.length === 0 ? (
        <EmptyState title={t("crops.empty")} />
      ) : (
        <ul className="space-y-3">
          {crops.map((c) => {
            const adv = data ? getAdvisory(c.crop, c.stage, data.forecast, 1, { drivers: data.drivers, block }) : null;
            const active = c.id === activeId;
            return (
              <li
                key={c.id}
                className={`rounded-card border bg-white p-4 shadow-soft transition ${active ? "border-leaf-500 ring-1 ring-leaf-200" : "border-line"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-leaf-50 text-xl" aria-hidden>
                      {CROPS[c.crop].emoji}
                    </span>
                    <div>
                      <p className="text-[15px] font-bold text-ink">
                        {t(`crop.${c.crop}`)}
                        {active && <span className="ml-2 rounded-full bg-leaf-100 px-2 py-0.5 text-[10.5px] font-bold text-leaf-800">{t("crops.active")}</span>}
                      </p>
                      <p className="text-[12.5px] text-muted">
                        {t(`stage.${c.stage}`)} · {c.areaAcres} ac
                        {c.sowingDate && ` · ${fmtDate(lang, c.sowingDate)}`}
                      </p>
                    </div>
                  </div>
                  {adv && <RiskBadge level={adv.severity} size="sm" label={adv.decision ? t(`decision.${adv.decision}`) : t(`type.${adv.type}`)} />}
                </div>
                {adv && <p className="mt-3 text-[13.5px] leading-relaxed text-body">{tm(adv.action)}</p>}
                <div className="mt-3.5 flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setActiveCrop(c.id)} disabled={active} icon={Star}>
                    {active ? t("crops.active") : t("crops.setActive")}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setDraft({ ...c })} icon={Pencil}>
                    {t("common.edit")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCrop(c.id)}
                    icon={Trash2}
                    className="text-red-700 hover:bg-red-50 hover:text-red-800"
                    aria-label={`${t("common.delete")} ${t(`crop.${c.crop}`)}`}
                  >
                    {t("common.delete")}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Form */}
      {draft ? (
        <Card pad>
          <CardHeader icon={Sprout} title={draft.id ? t("crops.editTitle") : t("crops.newTitle")} />
          <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label={t("common.crop")} htmlFor="f-crop">
              <Select id="f-crop" big value={draft.crop} onChange={(e) => setDraft({ ...draft, crop: e.target.value as CropId })}>
                {CROP_IDS.map((id) => (
                  <option key={id} value={id}>
                    {CROPS[id].emoji} {t(`crop.${id}`)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("common.stage")} htmlFor="f-stage">
              <Select id="f-stage" big value={draft.stage} onChange={(e) => setDraft({ ...draft, stage: e.target.value as GrowthStage })}>
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {t(`stage.${s}`)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("common.sowingDate")} htmlFor="f-date">
              <Input
                id="f-date"
                big
                type="date"
                value={draft.sowingDate ?? ""}
                disabled={draft.stage === "not_sown"}
                onChange={(e) => setDraft({ ...draft, sowingDate: e.target.value || undefined })}
              />
            </Field>
            <Field label={t("common.area")} htmlFor="f-area">
              <Input
                id="f-area"
                big
                type="number"
                inputMode="decimal"
                min={0.1}
                max={500}
                step={0.1}
                value={draft.areaAcres}
                onChange={(e) => setDraft({ ...draft, areaAcres: Number(e.target.value) })}
              />
            </Field>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" size="lg" className="flex-1">
                {t("common.save")}
              </Button>
              <Button type="button" variant="secondary" size="lg" onClick={() => setDraft(null)}>
                {t("common.cancel")}
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <button
          type="button"
          onClick={() => setDraft({ ...EMPTY })}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-card border border-dashed border-line-strong bg-white text-[14px] font-semibold text-body transition hover:border-leaf-400 hover:bg-leaf-50/50 hover:text-leaf-800"
        >
          <Plus className="h-4.5 w-4.5" aria-hidden /> {t("crops.add")}
        </button>
      )}
    </div>
  );
}
