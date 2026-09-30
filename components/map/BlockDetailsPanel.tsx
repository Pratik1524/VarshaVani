"use client";

import Link from "next/link";
import { Globe, MapPin, TriangleAlert, X } from "lucide-react";
import type { Block, BlockForecast, ClimateDrivers, Week } from "@/types";
import { getAdvisory, explainDrivers } from "@/lib/advisoryEngine";
import { blockName } from "@/data/blocks";
import { CROPS } from "@/data/crops";
import { fmtRange } from "@/lib/i18n";
import { useT } from "@/hooks/useT";
import { SURFACE } from "@/lib/ui";
import { ProbabilityBar } from "@/components/ui/ProbabilityBar";
import { ConfidenceMeter } from "@/components/ui/ConfidenceMeter";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { IconButton } from "@/components/ui/Button";

/** Selected-block details: probabilities, confidence, drivers, crop advisories. */
export function BlockDetailsPanel({
  block,
  forecast,
  drivers,
  week,
  onClose,
}: {
  block: Block;
  forecast: BlockForecast;
  drivers: ClimateDrivers;
  week: Week;
  onClose?: () => void;
}) {
  const { t, tm, lang } = useT();
  const w = forecast.weeks[week - 1];
  const why = explainDrivers(drivers, forecast, week, block);

  return (
    <section aria-labelledby="bdp-title" className={`space-y-4 p-4 sm:p-5 ${SURFACE}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 id="bdp-title" className="flex items-center gap-1.5 text-[1.15rem] font-bold tracking-[-0.01em]">
            <MapPin className="h-4.5 w-4.5 shrink-0 text-leaf-600" aria-hidden />
            {blockName(block, lang)}
          </h2>
          <p className="mt-0.5 text-[12.5px] text-muted">
            {block.district} · {block.zone}
          </p>
          <p className="text-[12.5px] font-medium text-body">
            {t("common.week", { n: week })}: {fmtRange(lang, w.startDate, w.endDate)}
          </p>
        </div>
        {onClose && <IconButton icon={X} label={t("common.close")} onClick={onClose} className="-mr-1 -mt-1" />}
      </div>

      {forecast.falseOnsetRisk && (
        <p className="flex items-start gap-2 rounded-control border border-red-200 bg-red-50 px-3 py-2 text-[13px] font-semibold text-red-800">
          <TriangleAlert className="mt-px h-4 w-4 shrink-0" aria-hidden />
          {t("home.falseOnset")}
        </p>
      )}

      <div className="space-y-3">
        <ProbabilityBar layer="onset" value={w.onset} />
        <ProbabilityBar layer="break" value={w.breakProb} />
        <ProbabilityBar layer="heavy" value={w.heavyRain} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-[12.5px] text-muted">
        <ConfidenceMeter value={w.confidence} showValue />
        <span>{t("outlook.rain", { mm: w.expectedRainMm })}</span>
      </div>

      <div>
        <h3 className="mb-2 text-[13px] font-bold text-ink">{t("map.majorCrops")}</h3>
        <ul className="space-y-2">
          {block.majorCrops.map((crop) => {
            const a = getAdvisory(crop, "not_sown", forecast, week, { drivers, block });
            return (
              <li key={crop} className="rounded-control border border-line p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-bold text-ink">
                    <span aria-hidden>{CROPS[crop].emoji}</span> {t(`crop.${crop}`)}
                  </span>
                  <RiskBadge level={a.severity} size="sm" label={a.decision ? t(`decision.${a.decision}`) : undefined} />
                </div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-body">{tm(a.action)}</p>
              </li>
            );
          })}
        </ul>
      </div>

      <details className="group rounded-control border border-line p-3" open>
        <summary className="flex cursor-pointer items-center gap-2 text-[13px] font-bold text-monsoon-800">
          <Globe className="h-4 w-4" aria-hidden /> {t("common.why")}
        </summary>
        <ul className="mt-2 space-y-1.5 text-[12.5px] leading-relaxed text-body">
          {why.map((m, i) => (
            <li key={i} className="flex gap-1.5">
              <span aria-hidden>·</span>
              {tm(m)}
            </li>
          ))}
        </ul>
        <Link href="/drivers" className="mt-2 inline-block text-[12.5px] font-semibold text-monsoon-700 underline decoration-monsoon-300 underline-offset-2 hover:text-monsoon-900">
          {t("nav.drivers")}
        </Link>
      </details>
    </section>
  );
}
