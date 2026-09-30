"use client";

import type { ReactNode } from "react";
import { CloudLightning, Droplets, Package, ShieldAlert, type LucideIcon } from "lucide-react";
import type { CropId } from "@/types";
import { ASSUMPTIONS } from "@/data/contingency";
import type { Needs } from "@/lib/contingency";
import { InfoPopover } from "./InfoPopover";
import { num, usePlannerText } from "./usePlannerText";

/** "What we will need" estimates, each with its formula in a popover. */
export function NeedsCards({ n, crop }: { n: Needs; crop: CropId }) {
  const { c, t } = usePlannerText();
  const A = ASSUMPTIONS;
  const cropName = t(`crop.${crop}`);

  const items: { key: string; icon: LucideIcon; tone: string; label: string; value: string; unit: string; hint: string; formula: ReactNode }[] = [
    {
      key: "seed",
      icon: Package,
      tone: "bg-sun-50 text-sun-600",
      label: c("needSeed"),
      value: num(n.seedQuintals),
      unit: c("unitQuintal"),
      hint: c("needSeedHint", { n: n.seed.blocks }),
      formula: (
        <>
          <p className="font-semibold text-ink">{c("fSeed")}</p>
          <p className="mt-1.5 rounded-control bg-slate-50 px-2 py-1.5 font-mono text-[11.5px] text-ink ring-1 ring-line">
            {c("fSeedCalc", { area: num(n.seed.areaHa), share: Math.round(n.seed.resowShare * 100), rate: n.seed.seedRateKgHa, q: num(n.seedQuintals) })}
          </p>
          <p className="mt-1.5">{c("fSeedArea", { crop: cropName })}</p>
        </>
      ),
    },
    {
      key: "irr",
      icon: Droplets,
      tone: "bg-monsoon-50 text-monsoon-700",
      label: c("needIrr"),
      value: String(n.irrigationBlocks),
      unit: c("unitBlocks"),
      hint: c("needIrrHint", { p: A.rainfedIrrigatedPct }),
      formula: <p>{c("fIrr", { p: A.dryThreshold, irr: A.rainfedIrrigatedPct })}</p>,
    },
    {
      key: "drain",
      icon: CloudLightning,
      tone: "bg-orange-50 text-orange-700",
      label: c("needDrain"),
      value: String(n.drainageBlocks),
      unit: c("unitBlocks"),
      hint: c("needDrainHint"),
      formula: <p>{c("fDrain", { p: A.heavyThreshold })}</p>,
    },
    {
      key: "ins",
      icon: ShieldAlert,
      tone: "bg-leaf-50 text-leaf-700",
      label: c("needIns"),
      value: String(n.insuranceBlocks),
      unit: c("unitBlocks"),
      hint: c("needInsHint", { p: A.floodInsuranceThreshold }),
      formula: <p>{c("fIns", { p: A.dryThreshold, h: A.floodInsuranceThreshold })}</p>,
    },
  ];

  return (
    <ul className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
      {items.map((k) => (
        <li key={k.key} className="flex flex-col rounded-card border border-line bg-white p-4 shadow-soft">
          <div className="flex items-start justify-between gap-2">
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-control ${k.tone}`}>
              <k.icon className="h-4.5 w-4.5" aria-hidden />
            </span>
            <InfoPopover label={c("howEstimated")} closeLabel={t("common.close")}>
              {k.formula}
              <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-sun-200 bg-sun-50 px-2 py-0.5 text-[10.5px] font-semibold text-sun-600">
                <span className="h-1.5 w-1.5 rounded-full bg-sun-400" aria-hidden />
                {c("illustrative")}
              </p>
            </InfoPopover>
          </div>
          <p className="mt-3 text-[12.5px] font-semibold text-muted">{k.label}</p>
          <p className="mt-1 flex items-baseline gap-1.5">
            <span className="text-[1.7rem] font-bold leading-none tracking-[-0.02em] tabular-nums text-ink">{k.value}</span>
            <span className="text-[12px] font-medium text-muted">{k.unit}</span>
          </p>
          <p className="mt-1.5 text-[11.5px] leading-snug text-muted">{k.hint}</p>
        </li>
      ))}
    </ul>
  );
}
