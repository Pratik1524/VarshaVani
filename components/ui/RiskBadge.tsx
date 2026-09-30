"use client";

import { CircleCheck, Eye, OctagonAlert, TriangleAlert, type LucideIcon } from "lucide-react";
import type { RiskLevel } from "@/types";
import { RISK_CLASSES } from "@/lib/riskColors";
import { useT } from "@/hooks/useT";

export const RISK_ICON: Record<RiskLevel, LucideIcon> = {
  low: CircleCheck,
  watch: Eye,
  elevated: TriangleAlert,
  high: OctagonAlert,
};

export function RiskIcon({ level, className = "h-4 w-4" }: { level: RiskLevel; className?: string }) {
  const Icon = RISK_ICON[level];
  return <Icon className={className} aria-hidden />;
}

interface Props {
  level: RiskLevel;
  /** Override label text (defaults to translated risk name). */
  label?: string;
  size?: "sm" | "md" | "lg";
  solid?: boolean;
  className?: string;
}

/** Colour + icon + text risk chip. Never colour alone. */
export function RiskBadge({ level, label, size = "md", solid = false, className = "" }: Props) {
  const { t } = useT();
  const c = RISK_CLASSES[level];
  const sizes = {
    sm: "text-[11.5px] px-2 py-0.5 gap-1",
    md: "text-[12.5px] px-2.5 py-1 gap-1.5",
    lg: "text-sm px-3 py-1.5 gap-2",
  }[size];
  const icon = size === "lg" ? "h-4.5 w-4.5" : size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold whitespace-nowrap ${sizes} ${
        solid ? `${c.solid} border-transparent` : `${c.bg} ${c.text} ${c.border}`
      } ${className}`}
    >
      <RiskIcon level={level} className={icon} />
      {label ?? t(`risk.${level}`)}
    </span>
  );
}
