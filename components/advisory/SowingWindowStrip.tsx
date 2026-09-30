"use client";

import { CalendarCheck } from "lucide-react";
import type { BlockForecast, CropId, SowDecision } from "@/types";
import { sowingWindows, type EngineOptions } from "@/lib/advisoryEngine";
import { fmtDate, fmtRange } from "@/lib/i18n";
import { useT } from "@/hooks/useT";
import { RISK_HEX } from "@/lib/riskColors";

const DEC_COLOR: Record<SowDecision, string> = { sow: RISK_HEX.low, caution: RISK_HEX.watch, wait: RISK_HEX.high };
const DEC_LABEL = { sow: "optimizer.good", caution: "optimizer.ok", wait: "optimizer.avoid" } as const;

function addDays(iso: string, d: number) {
  const x = new Date(`${iso}T00:00:00Z`);
  x.setUTCDate(x.getUTCDate() + d);
  return x.toISOString().slice(0, 10);
}

/**
 * 28-day heat strip. Each day inherits its week's sowing decision from the
 * advisory engine; the best window is the highest-scoring non-"wait" week.
 */
export function SowingWindowStrip({ crop, forecast, opts }: { crop: CropId; forecast: BlockForecast; opts?: EngineOptions }) {
  const { t, lang } = useT();
  const windows = sowingWindows(crop, forecast, opts);
  const candidates = windows.filter((w) => w.decision !== "wait").sort((a, b) => b.score - a.score);
  const best = candidates[0];

  const days = windows.flatMap((w) =>
    Array.from({ length: 7 }, (_, i) => ({ date: addDays(w.startDate, i), week: w.week, decision: w.decision, score: w.score })),
  );

  return (
    <div>
      <div
        className={`mb-3 flex items-center gap-2 rounded-control border px-3 py-2.5 text-[14px] font-bold ${
          best
            ? best.decision === "sow"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-yellow-200 bg-yellow-50 text-yellow-900"
            : "border-red-200 bg-red-50 text-red-800"
        }`}
      >
        <CalendarCheck className="h-4.5 w-4.5 shrink-0" aria-hidden />
        {best ? t("optimizer.best", { range: fmtRange(lang, best.startDate, best.endDate) }) : t("optimizer.none")}
      </div>

      <div className="grid grid-cols-4 gap-1.5" role="list" aria-label={t("optimizer.title")}>
        {windows.map((w) => (
          <div
            key={w.week}
            role="listitem"
            className={`rounded-control p-1.5 ${best?.week === w.week ? "bg-leaf-50 ring-1 ring-leaf-300" : ""}`}
          >
            <p className="mb-1 text-center text-[11px] font-bold text-body">{t("common.weekShort", { n: w.week })}</p>
            <div className="grid grid-cols-7 gap-0.5">
              {days
                .filter((d) => d.week === w.week)
                .map((d) => (
                  <span
                    key={d.date}
                    title={`${fmtDate(lang, d.date)}: ${t(DEC_LABEL[d.decision])}`}
                    className="h-7 rounded-[3px] sm:h-8"
                    style={{ backgroundColor: DEC_COLOR[d.decision], opacity: 0.5 + (d.score / 100) * 0.5 }}
                  />
                ))}
            </div>
            <p className="mt-1.5 text-center text-[11px] font-semibold text-body">
              {w.decision === "sow" ? "✓" : w.decision === "caution" ? "!" : "✕"} {t(DEC_LABEL[w.decision])}
            </p>
            <p className="text-center text-[10px] text-muted">{t("optimizer.score", { score: w.score })}</p>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-muted">
        <span>{fmtDate(lang, days[0].date)}</span>
        <span>{fmtDate(lang, days[days.length - 1].date)}</span>
      </div>
    </div>
  );
}
