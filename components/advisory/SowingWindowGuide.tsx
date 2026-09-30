"use client";

import { CheckCircle2, Info, ListChecks } from "lucide-react";
import type { BlockForecast, CropId, SowDecision } from "@/types";
import { sowingWindows, type EngineOptions } from "@/lib/advisoryEngine";
import { fmtRange } from "@/lib/i18n";
import { tx, type ExtraKey } from "@/lib/i18n/farmerExtras";
import { useT } from "@/hooks/useT";
import { RISK_HEX } from "@/lib/riskColors";
import { CROPS } from "@/data/crops";
import { INSET } from "@/lib/ui";

const DEC_COLOR: Record<SowDecision, string> = { sow: RISK_HEX.low, caution: RISK_HEX.watch, wait: RISK_HEX.high };
const DEC_LABEL = { sow: "optimizer.good", caution: "optimizer.ok", wait: "optimizer.avoid" } as const;
const DEC_TEXT: Record<SowDecision, ExtraKey> = { sow: "guideSow", caution: "guideCaution", wait: "guideWait" };
const DEC_CHIP: Record<SowDecision, string> = {
  sow: "bg-green-50 text-green-800 ring-green-200",
  caution: "bg-yellow-50 text-yellow-900 ring-yellow-200",
  wait: "bg-red-50 text-red-800 ring-red-200",
};

/**
 * Plain-language companion to the sowing-window strip: what the best window
 * means, what each week looks like, how to read the colours and score, and a
 * pre-sowing checklist.
 */
export function SowingWindowGuide({ crop, forecast, opts }: { crop: CropId; forecast: BlockForecast; opts?: EngineOptions }) {
  const { t, lang } = useT();
  const windows = sowingWindows(crop, forecast, opts);
  const best = windows.filter((w) => w.decision !== "wait").sort((a, b) => b.score - a.score)[0];
  const cropName = t(`crop.${crop}`);
  const bestWeek = best ? forecast.weeks[best.week - 1] : undefined;

  return (
    <div className="mt-5 space-y-4 border-t border-line pt-4">
      <div>
        <h3 className="flex items-center gap-1.5 text-[14.5px] font-bold">
          <Info className="h-4 w-4 shrink-0 text-leaf-600" aria-hidden />
          {tx(lang, "guideTitle")}
        </h3>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-body">
          {best && bestWeek
            ? tx(lang, "guideSummaryBest", {
                crop: cropName,
                week: t("common.week", { n: best.week }),
                range: fmtRange(lang, best.startDate, best.endDate),
                score: best.score,
                onset: bestWeek.onset,
                brk: bestWeek.breakProb,
              })
            : tx(lang, "guideSummaryNone", { crop: cropName })}
        </p>
      </div>

      {/* Week by week */}
      <div>
        <h4 className="mb-2 text-[13px] font-bold">{tx(lang, "guideWeekByWeek")}</h4>
        <ul className="space-y-2">
          {windows.map((w) => {
            const wf = forecast.weeks[w.week - 1];
            return (
              <li key={w.week} className={`px-3 py-2.5 ${INSET} ${best?.week === w.week ? "ring-1 ring-leaf-300" : ""}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[13px] font-bold text-ink">
                    {t("common.week", { n: w.week })} <span className="font-medium text-muted">· {fmtRange(lang, w.startDate, w.endDate)}</span>
                  </p>
                  <span className={`rounded-full px-2 py-0.5 text-[11.5px] font-semibold ring-1 ${DEC_CHIP[w.decision]}`}>
                    {t(DEC_LABEL[w.decision])} · {w.score}/100
                  </span>
                </div>
                <p className="mt-1 text-[12px] text-muted">
                  🌧 {tx(lang, "guideRain", { p: wf.onset })} · ☀️ {tx(lang, "guideDry", { p: wf.breakProb })}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-body">{tx(lang, DEC_TEXT[w.decision])}</p>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Reading the strip */}
      <div>
        <h4 className="mb-2 text-[13px] font-bold">{tx(lang, "guideReadTitle")}</h4>
        <ul className="space-y-1.5 text-[13px] text-body">
          {(["sow", "caution", "wait"] as SowDecision[]).map((d) => (
            <li key={d} className="flex items-center gap-2">
              <span className="h-4 w-4 shrink-0 rounded-[3px]" style={{ backgroundColor: DEC_COLOR[d] }} aria-hidden />
              {tx(lang, d === "sow" ? "guideReadGreen" : d === "caution" ? "guideReadYellow" : "guideReadRed")}
            </li>
          ))}
        </ul>
        <p className="mt-2 flex items-center gap-2 text-[12.5px] leading-relaxed text-muted">
          <span className="flex shrink-0 gap-0.5" aria-hidden>
            {[0.55, 0.75, 1].map((o) => (
              <span key={o} className="h-4 w-2.5 rounded-[2px]" style={{ backgroundColor: RISK_HEX.low, opacity: o }} />
            ))}
          </span>
          {tx(lang, "guideReadShade")}
        </p>
      </div>

      <div className={`px-3 py-2.5 ${INSET}`}>
        <h4 className="text-[13px] font-bold">{tx(lang, "guideScoreTitle")}</h4>
        <p className="mt-1 text-[13px] leading-relaxed text-body">{tx(lang, "guideScoreBody")}</p>
      </div>

      {/* Checklist */}
      <div>
        <h4 className="mb-2 flex items-center gap-1.5 text-[13px] font-bold">
          <ListChecks className="h-4 w-4 shrink-0 text-leaf-600" aria-hidden />
          {tx(lang, "guideCheckTitle")}
        </h4>
        <ul className="space-y-1.5">
          {(["guideCheck1", "guideCheck2", "guideCheck3", "guideCheck4"] as ExtraKey[]).map((k) => (
            <li key={k} className="flex gap-2 text-[13px] leading-relaxed text-body">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-leaf-600" aria-hidden />
              {tx(lang, k, { mm: CROPS[crop].sowingRainMm })}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
