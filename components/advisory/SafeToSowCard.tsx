"use client";

import { motion } from "framer-motion";
import { CircleCheck, CloudRain, OctagonAlert, TriangleAlert, type LucideIcon } from "lucide-react";
import type { Advisory, RiskLevel, SowDecision } from "@/types";
import { CROPS } from "@/data/crops";
import { useT } from "@/hooks/useT";
import { RiskIcon } from "@/components/ui/RiskBadge";
import { ConfidenceMeter } from "@/components/ui/ConfidenceMeter";
import { ListenButton } from "./ListenButton";
import { advisoryToText } from "@/lib/i18n";

/**
 * One solid tone per decision — no gradients. Colour is always paired with an
 * icon and the decision word, so the meaning survives without colour.
 */
const DECISION_STYLE: Record<
  SowDecision,
  { bar: string; barText: string; body: string; headline: string; icon: LucideIcon; iconWrap: string }
> = {
  sow: {
    bar: "bg-leaf-700",
    barText: "text-leaf-50",
    body: "bg-leaf-50",
    headline: "text-leaf-900",
    icon: CircleCheck,
    iconWrap: "bg-leaf-700 text-white",
  },
  caution: {
    bar: "bg-sun-400",
    barText: "text-sun-950",
    body: "bg-sun-50",
    headline: "text-soil-800",
    icon: TriangleAlert,
    iconWrap: "bg-sun-400 text-sun-950",
  },
  wait: {
    bar: "bg-red-600",
    barText: "text-red-50",
    body: "bg-red-50",
    headline: "text-red-900",
    icon: OctagonAlert,
    iconWrap: "bg-red-600 text-white",
  },
};

const SEVERITY_TO_DECISION: Record<RiskLevel, SowDecision> = { low: "sow", watch: "caution", elevated: "caution", high: "wait" };

/**
 * The big home-screen answer. For pre-sowing stages it shows the sowing
 * decision; for sown crops it shows this week's most important action.
 */
export function SafeToSowCard({
  advisory,
  recentRainMm,
  falseOnset,
  compact = false,
}: {
  advisory: Advisory;
  recentRainMm: number;
  falseOnset: boolean;
  /** Smaller type and padding, for side-by-side comparisons (simulator). */
  compact?: boolean;
}) {
  const { t, tm, lang } = useT();
  const preSowing = !!advisory.decision;
  const decision = advisory.decision ?? SEVERITY_TO_DECISION[advisory.severity];
  const s = DECISION_STYLE[decision];
  const Icon = s.icon;
  const cropName = t(`crop.${advisory.crop}`);

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      aria-labelledby="sts-title"
      className="overflow-hidden rounded-card border border-line bg-white shadow-raise"
    >
      {/* Question strip: which crop, and what the recent rain was */}
      <div className={`flex flex-wrap items-center justify-between gap-2 ${compact ? "px-3.5 py-2" : "px-4 py-2.5"} ${s.bar} ${s.barText}`}>
        <span className={`flex items-center gap-2 font-semibold ${compact ? "text-[12px]" : "text-[13px]"}`}>
          <span aria-hidden>{CROPS[advisory.crop].emoji}</span>
          <span id="sts-title">{preSowing ? t("home.safeToSow", { crop: cropName }) : t("home.thisWeek", { crop: cropName })}</span>
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-black/12 px-2.5 py-0.5 text-[11.5px] font-semibold">
          <CloudRain className="h-3.5 w-3.5" aria-hidden />
          {t("home.recentRain", { mm: recentRainMm })}
        </span>
      </div>

      {/* The answer */}
      <div className={`${compact ? "px-3.5 py-3.5" : "px-4 py-5"} ${s.body}`}>
        <div className={`flex items-start ${compact ? "gap-3" : "gap-4"}`}>
          <span className={`grid shrink-0 place-items-center rounded-full ${compact ? "h-10 w-10" : "h-14 w-14"} ${s.iconWrap}`}>
            <Icon className={compact ? "h-5.5 w-5.5" : "h-8 w-8"} strokeWidth={2.2} aria-hidden />
          </span>
          <div className="min-w-0">
            <p
              className={`font-bold leading-[1.15] tracking-[-0.015em] ${compact ? "text-[1.15rem]" : "text-[1.75rem] sm:text-[2rem]"} ${s.headline}`}
            >
              {preSowing ? t(`decision.${decision}`) : t(`type.${advisory.type}`)}
            </p>
            <p className={`mt-1 font-medium leading-snug text-body ${compact ? "text-[13px]" : "text-[15px] sm:text-base"}`}>{tm(advisory.action)}</p>
          </div>
        </div>

        {advisory.reasons[0] && (
          <p
            className={`flex gap-2 rounded-control border border-white/80 bg-white/75 leading-relaxed text-body ${
              compact ? "mt-3 px-2.5 py-2 text-[12.5px]" : "mt-4 px-3 py-2.5 text-[14px]"
            }`}
          >
            <RiskIcon level={advisory.severity} className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{tm(advisory.reasons[0])}</span>
          </p>
        )}
        {falseOnset && preSowing && decision !== "sow" && advisory.reasons[0]?.key !== "reason.false_onset" && (
          <p className="mt-2 flex items-start gap-1.5 text-[13.5px] font-semibold text-red-800">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {t("home.falseOnset")}
          </p>
        )}
      </div>

      {/* Provenance + voice */}
      <div className={`flex flex-wrap items-center justify-between gap-2 border-t border-line ${compact ? "px-3.5 py-2" : "px-4 py-2.5"}`}>
        <ConfidenceMeter value={advisory.confidence} showValue />
        <ListenButton id={`sts-${advisory.id}`} text={advisoryToText(lang, advisory, { includeWhy: true })} />
      </div>
    </motion.section>
  );
}
