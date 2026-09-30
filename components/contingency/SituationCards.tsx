"use client";

import { motion } from "framer-motion";
import { CircleCheck, CloudLightning, Gauge, OctagonAlert, type LucideIcon } from "lucide-react";
import type { RiskLevel } from "@/types";
import { ASSUMPTIONS } from "@/data/contingency";
import { RISK_CLASSES, RISK_HEX } from "@/lib/riskColors";
import { confidenceLevel } from "@/data/forecasts";
import type { Situation } from "@/lib/contingency";
import { usePlannerText } from "./usePlannerText";

/** Four situation tiles, coloured with the shared risk palette (icon + label, never colour alone). */
export function SituationCards({ s }: { s: Situation }) {
  const { c, t } = usePlannerText();
  const conf = confidenceLevel(s.avgConfidence);
  const confLevel: RiskLevel = conf === "high" ? "low" : conf === "medium" ? "watch" : "elevated";

  const cards: { key: string; icon: LucideIcon; level: RiskLevel; label: string; value: string; sub: string; hint: string; share: number; tag: string }[] = [
    {
      key: "dry",
      icon: OctagonAlert,
      level: s.dry ? "high" : "low",
      label: c("sitDry"),
      value: String(s.dry),
      sub: c("ofBlocks", { n: s.total }),
      hint: c("sitDryHint", { p: ASSUMPTIONS.dryThreshold }),
      share: s.total ? s.dry / s.total : 0,
      tag: s.dry ? t("risk.high") : t("risk.low"),
    },
    {
      key: "safe",
      icon: CircleCheck,
      level: "low",
      label: c("sitSafe"),
      value: String(s.safe),
      sub: c("ofBlocks", { n: s.total }),
      hint: c("sitSafeHint"),
      share: s.total ? s.safe / s.total : 0,
      tag: t("decision.sow"),
    },
    {
      key: "heavy",
      icon: CloudLightning,
      level: s.heavy ? "elevated" : "low",
      label: c("sitHeavy"),
      value: String(s.heavy),
      sub: c("ofBlocks", { n: s.total }),
      hint: c("sitHeavyHint", { p: ASSUMPTIONS.heavyThreshold }),
      share: s.total ? s.heavy / s.total : 0,
      tag: s.heavy ? t("risk.elevated") : t("risk.low"),
    },
    {
      key: "conf",
      icon: Gauge,
      level: confLevel,
      label: c("sitConf"),
      value: `${s.avgConfidence}%`,
      sub: t(`conf.${conf}`),
      hint: c("sitConfHint"),
      share: s.avgConfidence / 100,
      tag: t(`conf.${conf}`),
    },
  ];

  return (
    <ul className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
      {cards.map((k, i) => {
        const cls = RISK_CLASSES[k.level];
        return (
          <motion.li
            key={k.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
            className={`relative overflow-hidden rounded-card border bg-white p-4 shadow-soft ${cls.border}`}
          >
            <span className="absolute inset-x-0 top-0 h-1" style={{ background: RISK_HEX[k.level] }} aria-hidden />
            <div className="flex items-start justify-between gap-2">
              <p className="text-[12.5px] font-semibold leading-snug text-muted">{k.label}</p>
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-control ${cls.bg} ${cls.text}`}>
                <k.icon className="h-4.5 w-4.5" aria-hidden />
              </span>
            </div>
            <p className="mt-2 flex items-baseline gap-1.5">
              <span className="text-[1.9rem] font-bold leading-none tracking-[-0.02em] tabular-nums text-ink">{k.value}</span>
              <span className="text-[12px] font-medium text-muted">{k.sub}</span>
            </p>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden>
              <motion.div
                className="h-full rounded-full"
                style={{ background: RISK_HEX[k.level] }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.round(k.share * 100)}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-1.5">
              <p className="text-[11.5px] leading-snug text-muted">{k.hint}</p>
              <span className={`rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${cls.bg} ${cls.text} ${cls.border}`}>{k.tag}</span>
            </div>
          </motion.li>
        );
      })}
    </ul>
  );
}
