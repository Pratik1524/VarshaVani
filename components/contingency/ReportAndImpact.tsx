"use client";

import { motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { IndianRupee, Info, Sprout, Tractor, Users, type LucideIcon } from "lucide-react";
import type { CropId } from "@/types";
import { ASSUMPTIONS } from "@/data/contingency";
import type { Impact, VerificationWeek } from "@/lib/contingency";
import { axisProps, CHART, gridProps } from "@/lib/chartTheme";
import { fmtDate } from "@/lib/i18n";
import { ChartTooltip } from "@/components/ui/ChartTooltip";
import { num, usePlannerText } from "./usePlannerText";

/** "Simulated" qualifier chip. */
export function SimChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-sun-200 bg-sun-50 px-2 py-0.5 text-[10.5px] font-semibold text-sun-600">
      <span className="h-1.5 w-1.5 rounded-full bg-sun-400" aria-hidden />
      {label}
    </span>
  );
}

/** Mock predicted-vs-actual hit rate for the last 4 weeks, plus lead-time accuracy. */
export function ReportCard({ weeks, lead }: { weeks: VerificationWeek[]; lead: { lead: number; hitRate: number }[] }) {
  const { c, lang } = usePlannerText();
  const data = weeks.map((w) => ({ ...w, label: fmtDate(lang, w.weekStart) }));
  const avg = Math.round(weeks.reduce((s, w) => s + w.hitRate, 0) / Math.max(1, weeks.length));

  return (
    <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
      <div className="rounded-card bg-gradient-to-b from-slate-50 to-white p-2 ring-1 ring-line">
        <div className="flex items-center justify-between px-2 pt-1">
          <p className="text-[12px] font-semibold text-muted">{c("hitRate")}</p>
          <p className="text-[12px] font-bold tabular-nums text-ink">{c("avgShort", { p: avg })}</p>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 24, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="cp-hit" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={CHART.green} stopOpacity={0.95} />
                  <stop offset="100%" stopColor={CHART.greenSoft} stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis domain={[0, 100]} unit="%" {...axisProps} />
              <Tooltip
                cursor={{ fill: "rgba(67,140,53,0.06)", radius: 8 }}
                content={
                  <ChartTooltip
                    labelFormatter={(l) => c("weekOf", { date: l })}
                    valueFormatter={(v) => `${v}%`}
                    colorFor={() => CHART.green}
                    footer={(p) => {
                      const row = (p[0] as { payload?: VerificationWeek } | undefined)?.payload;
                      return row ? c("hitsOf", { h: row.hits, n: row.forecasts }) : null;
                    }}
                  />
                }
              />
              <Bar dataKey="hitRate" name={c("hitRate")} fill="url(#cp-hit)" radius={[8, 8, 2, 2]} maxBarSize={56} background={{ fill: "#eef2f7", radius: 8 }} animationDuration={800}>
                <LabelList dataKey="hitRate" position="top" formatter={(v) => `${v}%`} style={{ fontSize: 11, fontWeight: 700, fill: "#334155" }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-card border border-line bg-white p-3.5">
        <p className="text-[12.5px] font-bold text-ink">{c("leadTitle")}</p>
        <ul className="mt-2.5 space-y-2">
          {lead.map((l) => (
            <li key={l.lead} className="grid grid-cols-[auto_1fr_2.5rem] items-center gap-2 text-[12px]">
              <span className="min-w-10 whitespace-nowrap font-semibold text-muted">{c("leadWeek", { n: l.lead })}</span>
              <span className="h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden>
                <motion.span
                  className="block h-full rounded-full bg-gradient-to-r from-monsoon-500 to-monsoon-300"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${l.hitRate}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: l.lead * 0.08 }}
                />
              </span>
              <span className="text-right font-bold tabular-nums text-ink">{l.hitRate}%</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex gap-2 rounded-control bg-monsoon-50 p-2.5 text-[12px] leading-relaxed text-monsoon-900">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {c("leadNote", { a: lead[0]?.hitRate ?? 0, b: lead[lead.length - 1]?.hitRate ?? 0 })}
        </p>
      </div>
    </div>
  );
}

/** Four simulated outcome tiles. */
export function ImpactStrip({ impact, crop }: { impact: Impact; crop: CropId }) {
  const { c, t } = usePlannerText();
  const inr = (v: number) =>
    v >= 1e7 ? `₹${(v / 1e7).toFixed(1)} ${c("crore")}` : v >= 1e5 ? `₹${(v / 1e5).toFixed(1)} ${c("lakh")}` : `₹${num(v)}`;

  const items: { key: string; icon: LucideIcon; tone: string; label: string; value: string; hint: string }[] = [
    { key: "farmers", icon: Users, tone: "from-monsoon-50 text-monsoon-700", label: c("impFarmers"), value: num(impact.farmersReached), hint: c("impFarmersHint", { p: Math.round(ASSUMPTIONS.reachShare * 100) }) },
    { key: "decisions", icon: Sprout, tone: "from-leaf-50 text-leaf-700", label: c("impDecisions"), value: num(impact.decisionsChanged), hint: c("impDecisionsHint") },
    { key: "ha", icon: Tractor, tone: "from-sun-50 text-sun-600", label: c("impHectares"), value: `${num(impact.hectaresProtected)} ha`, hint: c("impHectaresHint", { crop: t(`crop.${crop}`) }) },
    { key: "loss", icon: IndianRupee, tone: "from-orange-50 text-orange-700", label: c("impLoss"), value: inr(impact.lossAvoidedInr), hint: c("impLossHint", { c: num(ASSUMPTIONS.resowingCostPerHa) }) },
  ];

  return (
    <ul className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4 xl:grid-cols-2">
      {items.map((k, i) => (
        <motion.li
          key={k.key}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.06 }}
          className={`rounded-card border border-line bg-gradient-to-br to-white p-4 shadow-soft ${k.tone}`}
        >
          <div className="flex items-center justify-between gap-2">
            <k.icon className="h-5 w-5" aria-hidden />
            <SimChip label={c("simulated")} />
          </div>
          <p className="mt-3 text-[12.5px] font-semibold text-muted">{k.label}</p>
          <p className="mt-1 text-[1.5rem] font-bold leading-none tracking-[-0.02em] tabular-nums text-ink">{k.value}</p>
          <p className="mt-1.5 text-[11.5px] leading-snug text-muted">{k.hint}</p>
        </motion.li>
      ))}
    </ul>
  );
}
