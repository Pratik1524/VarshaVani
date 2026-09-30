"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CloudRain, Droplets, Gauge, Home, MapPin, TriangleAlert } from "lucide-react";
import type { Block, BlockForecast, Layer, Week } from "@/types";
import { blockName } from "@/data/blocks";
import { CROPS } from "@/data/crops";
import { RISK_HEX, riskForLayer } from "@/lib/riskColors";
import { SURFACE } from "@/lib/ui";
import { useT } from "@/hooks/useT";
import { RiskBadge } from "@/components/ui/RiskBadge";

const FIELD = { onset: "onset", break: "breakProb", heavy: "heavyRain" } as const;

/**
 * Short description of the clicked block, shown under the map (officer /map).
 * Animates in and cross-fades when a different block is chosen.
 */
export function BlockSummaryCard({ block, forecast, layer, week }: { block?: Block; forecast?: BlockForecast; layer: Layer; week: Week }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence mode="wait" initial={false}>
      {block && forecast && (
        <motion.div
          key={block.id}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <Summary block={block} forecast={forecast} layer={layer} week={week} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Summary({ block, forecast, layer, week }: { block: Block; forecast: BlockForecast; layer: Layer; week: Week }) {
  const { t, lang } = useT();
  const w = forecast.weeks[week - 1];
  const value = w[FIELD[layer]];
  const level = riskForLayer(layer, value);
  const name = blockName(block, lang);
  const nf = new Intl.NumberFormat("en-IN");

  const stats = [
    { icon: Gauge, label: t("map.confidence"), value: `${w.confidence}%` },
    { icon: CloudRain, label: t("map.expectedRain"), value: `${w.expectedRainMm} mm` },
    { icon: Droplets, label: t("map.irrigated"), value: `${block.irrigatedPct}%` },
    { icon: Home, label: t("map.villages"), value: block.villages.slice(0, 2).join(", ") },
  ];

  return (
    <section aria-live="polite" aria-labelledby="bsc-title" className={`relative overflow-hidden p-4 sm:p-5 ${SURFACE}`}>
      {/* Risk-coloured accent on the left edge */}
      <span aria-hidden className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: RISK_HEX[level] }} />
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">{t("map.about")}</p>
          <h2 id="bsc-title" className="mt-0.5 flex items-center gap-1.5 text-[1.05rem] font-bold tracking-[-0.01em]">
            <MapPin className="h-4 w-4 shrink-0 text-leaf-600" aria-hidden />
            {name}
            <span className="text-[12.5px] font-medium text-muted">
              · {block.district} · {block.zone}
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold text-body">
            {t("map.aboutWeek", { week, layer: t(`layer.${layer}`) })}: <span className="tabular-nums text-ink">{value}%</span>
          </span>
          <RiskBadge level={level} size="sm" />
        </div>
      </div>

      <p className="mt-2.5 text-[13px] leading-relaxed text-body">
        {t("map.aboutBody", {
          block: name,
          district: block.district,
          zone: block.zone,
          farmers: nf.format(block.farmers),
          area: nf.format(block.kharifAreaHa),
          irr: block.irrigatedPct,
        })}
      </p>

      {forecast.falseOnsetRisk && (
        <p className="mt-2 flex items-start gap-1.5 text-[12.5px] font-semibold text-red-700">
          <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
          {t("home.falseOnset")}
        </p>
      )}

      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map((s, i) => (
          <motion.li
            key={s.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * i + 0.1, duration: 0.25 }}
            className="min-w-0 rounded-control border border-line bg-slate-50/70 px-2.5 py-2"
          >
            <span className="flex items-center gap-1 text-[11px] font-semibold text-muted">
              <s.icon className="h-3.5 w-3.5" aria-hidden />
              {s.label}
            </span>
            <span className="mt-0.5 block truncate text-[13px] font-bold text-ink" title={s.value}>
              {s.value}
            </span>
          </motion.li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {block.majorCrops.map((c) => (
          <span key={c} className="rounded-full border border-line bg-white px-2 py-0.5 text-[12px] font-medium text-body">
            <span aria-hidden>{CROPS[c].emoji}</span> {t(`crop.${c}`)}
          </span>
        ))}
        <span className="ml-auto hidden text-[11.5px] text-muted lg:inline">{t("map.aboutHint")}</span>
      </div>
    </section>
  );
}
