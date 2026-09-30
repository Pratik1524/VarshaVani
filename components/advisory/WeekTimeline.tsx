"use client";

import type { BlockForecast, Layer, Week } from "@/types";
import { RISK_CLASSES, RISK_HEX, probWord, riskForLayer } from "@/lib/riskColors";
import { fmtRange } from "@/lib/i18n";
import { useT } from "@/hooks/useT";
import { ConfidenceMeter } from "@/components/ui/ConfidenceMeter";
import { LAYER_ICON } from "@/components/ui/ProbabilityBar";
import { RiskIcon } from "@/components/ui/RiskBadge";

const LAYERS: { layer: Layer; field: "onset" | "breakProb" | "heavyRain" }[] = [
  { layer: "onset", field: "onset" },
  { layer: "break", field: "breakProb" },
  { layer: "heavy", field: "heavyRain" },
];

/** Colour + icon + word + % chip for one probability. */
export function RiskChip({ layer, value }: { layer: Layer; value: number }) {
  const { t } = useT();
  const level = riskForLayer(layer, value);
  const c = RISK_CLASSES[level];
  const Icon = LAYER_ICON[layer];
  return (
    <div className={`flex items-center justify-between gap-2 rounded-control border px-2.5 py-1.5 ${c.bg} ${c.border}`}>
      <span className={`flex min-w-0 items-center gap-1.5 text-[12.5px] font-semibold ${c.text}`}>
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
        <span className="truncate">{t(`layer.${layer}`)}</span>
      </span>
      <span className={`flex items-center gap-1 text-[12.5px] font-bold tabular-nums ${c.text}`}>
        <RiskIcon level={level} className="h-3.5 w-3.5" />
        {t(`pw.${probWord(value)}`)} · {value}%
      </span>
    </div>
  );
}

/** Week-by-week outlook cards with colour-coded risk chips and confidence. */
export function WeekTimeline({
  forecast,
  selected,
  onSelect,
  compact = false,
}: {
  forecast: BlockForecast;
  selected?: Week;
  onSelect?: (w: Week) => void;
  compact?: boolean;
}) {
  const { t, lang } = useT();
  return (
    <ol className={`grid gap-3 ${compact ? "grid-cols-2 sm:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
      {forecast.weeks.map((w) => {
        const worst = Math.max(w.breakProb, w.heavyRain);
        const topColor = RISK_HEX[riskForLayer("break", worst)];
        const isSel = selected === w.week;
        const content = compact ? (
          <>
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-bold text-ink">{t("common.week", { n: w.week })}</p>
              <RiskIcon level={riskForLayer("break", worst)} className="h-3.5 w-3.5 text-muted" />
            </div>
            <p className="text-[11px] text-muted">{fmtRange(lang, w.startDate, w.endDate)}</p>
            <div className="mt-2 space-y-1">
              {LAYERS.map(({ layer, field }) => {
                const Icon = LAYER_ICON[layer];
                const lvl = riskForLayer(layer, w[field]);
                return (
                  <p key={layer} className={`flex items-center justify-between rounded px-1.5 py-0.5 text-[11px] ${RISK_CLASSES[lvl].bg} ${RISK_CLASSES[lvl].text}`}>
                    <Icon className="h-3.5 w-3.5" aria-label={t(`layer.${layer}`)} />
                    <span className="font-semibold tabular-nums">
                      {t(`pw.${probWord(w[field])}`)} {w[field]}%
                    </span>
                  </p>
                );
              })}
            </div>
            <div className="mt-2">
              <ConfidenceMeter value={w.confidence} />
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[15px] font-bold text-ink">{t("common.week", { n: w.week })}</p>
                <p className="text-[12px] text-muted">{fmtRange(lang, w.startDate, w.endDate)}</p>
              </div>
              <ConfidenceMeter value={w.confidence} showValue />
            </div>
            <div className="mt-3 space-y-1.5">
              {LAYERS.map(({ layer, field }) => (
                <RiskChip key={layer} layer={layer} value={w[field]} />
              ))}
            </div>
            <p className="mt-3 text-[12.5px] text-muted">{t("outlook.rain", { mm: w.expectedRainMm })}</p>
          </>
        );
        // Weeks 3-4 are hatched: lower skill, and the pattern says so without colour.
        const cls = `relative block h-full w-full overflow-hidden rounded-card border bg-white p-3 pt-4 text-left shadow-soft transition ${
          isSel ? "border-leaf-500 ring-1 ring-leaf-300" : "border-line"
        } ${w.week >= 3 ? "bg-[repeating-linear-gradient(135deg,#fff,#fff_11px,#f8fafc_11px,#f8fafc_22px)]" : ""}`;
        return (
          <li key={w.week}>
            {onSelect ? (
              <button type="button" onClick={() => onSelect(w.week)} aria-pressed={isSel} className={`${cls} hover:border-leaf-300`}>
                <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: topColor }} aria-hidden />
                {content}
              </button>
            ) : (
              <div className={cls}>
                <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: topColor }} aria-hidden />
                {content}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
