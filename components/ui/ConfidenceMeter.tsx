"use client";

import type { ConfidenceLevel } from "@/types";
import { confidenceLevel } from "@/data/forecasts";
import { useT } from "@/hooks/useT";

/** Signal-bar style confidence indicator (3 bars + text). */
export function ConfidenceMeter({ value, showValue = false }: { value: number; showValue?: boolean }) {
  const { t } = useT();
  const level: ConfidenceLevel = confidenceLevel(value);
  const filled = level === "high" ? 3 : level === "medium" ? 2 : 1;
  const color = level === "high" ? "bg-monsoon-600" : level === "medium" ? "bg-monsoon-400" : "bg-slate-400";
  return (
    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-muted" title={`${t("common.confidence")}: ${value}%`}>
      <span className="flex items-end gap-0.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span key={i} className={`w-1 rounded-sm ${i < filled ? color : "bg-slate-200"}`} style={{ height: 5 + i * 3.5 }} />
        ))}
      </span>
      {t(`conf.${level}`)}
      {showValue && <span className="tabular-nums text-slate-400">({value}%)</span>}
    </span>
  );
}
