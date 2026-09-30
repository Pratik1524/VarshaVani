"use client";

import { CloudLightning, CloudRain, Sun, type LucideIcon } from "lucide-react";
import type { Layer } from "@/types";
import { RISK_HEX, probWord, riskForLayer } from "@/lib/riskColors";
import { useT } from "@/hooks/useT";

export const LAYER_ICON: Record<Layer, LucideIcon> = {
  onset: CloudRain,
  break: Sun,
  heavy: CloudLightning,
};

interface Props {
  layer: Layer;
  value: number;
  label?: string;
  compact?: boolean;
}

/** Labelled probability bar: icon, name, plain word (Low/Medium/High) and %. */
export function ProbabilityBar({ layer, value, label, compact = false }: Props) {
  const { t } = useT();
  const level = riskForLayer(layer, value);
  const Icon = LAYER_ICON[layer];
  const name = label ?? t(`layer.${layer}`);
  const word = t(`pw.${probWord(value)}`);
  return (
    <div className={compact ? "space-y-1" : "space-y-1.5"}>
      <div className="flex items-center justify-between gap-2 text-[13px]">
        <span className="flex items-center gap-1.5 font-medium text-body">
          <Icon className="h-4 w-4 shrink-0 text-muted" aria-hidden />
          {name}
        </span>
        <span className="font-semibold tabular-nums text-ink">
          {word} <span className="font-normal text-muted">· {value}%</span>
        </span>
      </div>
      <div
        className={`${compact ? "h-1.5" : "h-2"} w-full overflow-hidden rounded-full bg-slate-100`}
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        aria-label={`${name}: ${value}% (${word})`}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${Math.max(3, value)}%`, backgroundColor: RISK_HEX[level] }}
        />
      </div>
    </div>
  );
}
