"use client";

import { useId, useState } from "react";
import { ChevronDown, Droplets, Globe, ListChecks, Lightbulb, Shuffle } from "lucide-react";
import type { Advisory } from "@/types";
import { CROPS } from "@/data/crops";
import { RISK_CLASSES } from "@/lib/riskColors";
import { advisoryToText } from "@/lib/i18n";
import { useT } from "@/hooks/useT";
import { EYEBROW, INSET } from "@/lib/ui";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { ConfidenceMeter } from "@/components/ui/ConfidenceMeter";
import { ListenButton } from "./ListenButton";
import { FeedbackWidget } from "./FeedbackWidget";

/**
 * Full advisory: severity, action, reasons, alternatives, irrigation tip,
 * expandable "Why this advice?" (climate drivers), voice and feedback.
 */
export function AdvisoryCard({
  advisory,
  showFeedback = true,
  defaultOpen = false,
  showListen = true,
}: {
  advisory: Advisory;
  showFeedback?: boolean;
  defaultOpen?: boolean;
  showListen?: boolean;
}) {
  const { t, tm, lang } = useT();
  const [open, setOpen] = useState(defaultOpen);
  const whyId = useId();
  const c = RISK_CLASSES[advisory.severity];

  return (
    <article className="overflow-hidden rounded-card border border-line bg-white shadow-soft">
      {/* Context strip: crop, stage, week + severity */}
      <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5 ${c.bg} ${c.border}`}>
        <div className="flex flex-wrap items-center gap-2 text-[13px] font-semibold text-ink">
          <span className="text-base" aria-hidden>
            {CROPS[advisory.crop].emoji}
          </span>
          {t(`crop.${advisory.crop}`)}
          <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-medium text-body">{t(`stage.${advisory.stage}`)}</span>
          <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-medium text-body">{t("common.week", { n: advisory.week })}</span>
        </div>
        <RiskBadge level={advisory.severity} size="sm" solid />
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        {/* 1. What should I do? */}
        <div>
          <p className={EYEBROW}>{t(`type.${advisory.type}`)}</p>
          <p className="mt-1 text-[17px] font-bold leading-snug text-ink sm:text-[19px]">{tm(advisory.action)}</p>
        </div>

        {/* 2. Why? */}
        <ul className="space-y-1.5" aria-label={t("common.reasons")}>
          {advisory.reasons.map((r, i) => (
            <li key={i} className="flex gap-2 text-[13.5px] leading-relaxed text-body">
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-slate-400" aria-hidden />
              {tm(r)}
            </li>
          ))}
        </ul>

        {advisory.alsoDo.length > 0 && (
          <div className={`${INSET} p-3`}>
            <p className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-bold text-ink">
              <ListChecks className="h-4 w-4 text-muted" aria-hidden /> {t("common.alsoDo")}
            </p>
            <ul className="space-y-1 text-[13px] leading-relaxed text-body">
              {advisory.alsoDo.map((m, i) => (
                <li key={i} className="flex gap-1.5">
                  <span aria-hidden>·</span>
                  {tm(m)}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-2.5 rounded-control border border-monsoon-100 bg-monsoon-50 p-3 text-[13px] leading-relaxed text-monsoon-900">
          <Droplets className="mt-0.5 h-4 w-4 shrink-0 text-monsoon-600" aria-hidden />
          <p>
            <span className="font-bold">{t("common.irrigation")}: </span>
            {tm(advisory.irrigationTip)}
          </p>
        </div>

        {advisory.alternatives.length > 0 && (
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-bold text-ink">
              <Shuffle className="h-4 w-4 text-muted" aria-hidden /> {t("common.alternatives")}
            </p>
            <ul className="space-y-1 text-[13px] leading-relaxed text-body">
              {advisory.alternatives.map((m, i) => (
                <li key={i} className="flex gap-2">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-sun-400" aria-hidden />
                  {tm(m)}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <ConfidenceMeter value={advisory.confidence} showValue />
          {showListen && <ListenButton id={advisory.id} text={advisoryToText(lang, advisory, { includeWhy: true })} />}
        </div>

        {/* 3. The technical detail, folded away by default */}
        <div className="overflow-hidden rounded-control border border-line">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={whyId}
            onClick={() => setOpen((o) => !o)}
            className="flex min-h-11 w-full items-center justify-between gap-2 px-3 text-left text-[13px] font-bold text-monsoon-800 transition hover:bg-monsoon-50/60"
          >
            <span className="flex items-center gap-2">
              <Globe className="h-4 w-4" aria-hidden /> {t("common.why")}
            </span>
            <ChevronDown className={`h-4.5 w-4.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden />
          </button>
          {open && (
            <ul id={whyId} className="space-y-2 border-t border-line bg-slate-50/60 px-3 py-3 text-[13px] leading-relaxed text-body">
              {advisory.drivers.map((d, i) => (
                <li key={i} className="flex gap-2">
                  <span className="font-bold text-monsoon-600" aria-hidden>
                    {i + 1}.
                  </span>
                  {tm(d)}
                </li>
              ))}
              <li className="pt-1 text-[11px] text-slate-400">Rule: {advisory.ruleId}</li>
            </ul>
          )}
        </div>

        {showFeedback && (
          <div className="border-t border-line pt-4">
            <FeedbackWidget advisory={advisory} />
          </div>
        )}
      </div>
    </article>
  );
}
