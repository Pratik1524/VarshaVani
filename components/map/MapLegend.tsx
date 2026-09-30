"use client";

import type { Layer } from "@/types";
import { RISK_HEX, RISK_ORDER } from "@/lib/riskColors";
import { RiskIcon } from "@/components/ui/RiskBadge";
import { useT } from "@/hooks/useT";

/** Legend with colour, icon, label and probability range. */
export function MapLegend({ layer }: { layer: Layer }) {
  const { t } = useT();
  // Ranges are for the "bad outcome" probability; onset is inverted.
  const ranges = layer === "onset" ? ["> 70%", "50–70%", "35–50%", "< 35%"] : ["< 30%", "30–50%", "50–65%", "≥ 65%"];
  return (
    <div className="rounded-control border border-line bg-white/96 p-2.5 text-[11.5px] shadow-raise backdrop-blur-sm">
      <p className="mb-1.5 font-bold text-ink">
        {t("map.legend")}: {t(`layer.${layer}`)}
      </p>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-4">
        {RISK_ORDER.map((lvl, i) => (
          <li key={lvl} className="flex items-center gap-1.5">
            <span className="grid h-4.5 w-4.5 shrink-0 place-items-center rounded text-white" style={{ backgroundColor: RISK_HEX[lvl] }}>
              <RiskIcon level={lvl} className="h-3 w-3" />
            </span>
            <span className="text-body">
              {t(`risk.${lvl}`)} <span className="text-slate-400">{ranges[i]}</span>
            </span>
          </li>
        ))}
      </ul>
      {layer === "onset" && <p className="mt-1.5 text-muted">{t("map.onsetNote")}</p>}
    </div>
  );
}
