"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Flame } from "lucide-react";
import type { BlockForecast, CropId, RiskLevel, Week } from "@/types";
import { BLOCKS, DISTRICTS } from "@/data/blocks";
import { CROPS, CROP_IDS } from "@/data/crops";
import { PRIORITY_THRESHOLD, blockDecision, breakNear, priorityScore } from "@/lib/priority";
import { riskFromProb, RISK_ORDER } from "@/lib/riskColors";
import { TR } from "@/lib/ui";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { Field, Select } from "@/components/ui/Field";
import { RowTh, Table, TableFrame, Td, Th, THead } from "@/components/ui/Table";
import { useT } from "@/hooks/useT";

type SortKey = "name" | "district" | "onset" | "break" | "heavy" | "confidence" | "priority";

export interface BlockRow {
  id: string;
  name: string;
  district: string;
  zone: string;
  onset: number;
  break: number;
  heavy: number;
  confidence: number;
  priority: number;
  risk: RiskLevel;
  falseOnset: boolean;
  irrigatedPct: number;
  decisionLabel: string;
  decisionSeverity: RiskLevel;
}

export function buildRows(forecasts: Record<string, BlockForecast>, week: Week, crop: CropId | "lead", decisionText: (d: string) => string): BlockRow[] {
  return BLOCKS.map((b) => {
    const f = forecasts[b.id];
    const w = f.weeks[week - 1];
    const adv = blockDecision(b, f, week, crop === "lead" ? undefined : crop);
    const bn = breakNear(f, week);
    return {
      id: b.id,
      name: b.name,
      district: b.district,
      zone: b.zone,
      onset: w.onset,
      break: bn,
      heavy: w.heavyRain,
      confidence: w.confidence,
      priority: priorityScore(b, f, week),
      risk: riskFromProb(Math.max(bn, w.heavyRain)),
      falseOnset: f.falseOnsetRisk,
      irrigatedPct: b.irrigatedPct,
      decisionLabel: `${CROPS[adv.crop].emoji} ${decisionText(adv.decision ?? "caution")}`,
      decisionSeverity: adv.severity,
    };
  });
}

/** Sortable / filterable block ranking with priority highlight. */
export function BlocksTable({ forecasts, week }: { forecasts: Record<string, BlockForecast>; week: Week }) {
  const { t } = useT();
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "priority", dir: -1 });
  const [district, setDistrict] = useState("all");
  const [risk, setRisk] = useState<RiskLevel | "all">("all");
  const [crop, setCrop] = useState<CropId | "lead">("lead");

  const rows = useMemo(() => {
    const all = buildRows(forecasts, week, crop, (d) => t(`decision.${d as "sow"}`));
    return all
      .filter((r) => district === "all" || r.district === district)
      .filter((r) => risk === "all" || r.risk === risk)
      .sort((a, b) => {
        const av = a[sort.key];
        const bv = b[sort.key];
        return (typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number)) * sort.dir;
      });
  }, [forecasts, week, crop, district, risk, sort, t]);

  const header = (key: SortKey, label: string, numeric = false) => {
    const active = sort.key === key;
    return (
      <Th numeric={numeric} aria-sort={active ? (sort.dir === 1 ? "ascending" : "descending") : "none"} className="p-0">
        <button
          type="button"
          onClick={() => setSort({ key, dir: active ? (sort.dir === 1 ? -1 : 1) : numeric ? -1 : 1 })}
          className={`inline-flex w-full items-center gap-1 px-3 py-2.5 transition hover:text-ink ${numeric ? "justify-end" : ""} ${active ? "text-monsoon-800" : ""}`}
        >
          {label}
          {active ? sort.dir === 1 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3 opacity-40" />}
        </button>
      </Th>
    );
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <Field label="District" htmlFor="bt-district" className="w-40">
          <Select id="bt-district" value={district} onChange={(e) => setDistrict(e.target.value)}>
            <option value="all">All districts</option>
            {DISTRICTS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </Select>
        </Field>
        <Field label="Risk" htmlFor="bt-risk" className="w-36">
          <Select id="bt-risk" value={risk} onChange={(e) => setRisk(e.target.value as RiskLevel | "all")}>
            <option value="all">All levels</option>
            {RISK_ORDER.map((r) => (
              <option key={r} value={r}>
                {t(`risk.${r}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Crop decision for" htmlFor="bt-crop" className="w-48">
          <Select id="bt-crop" value={crop} onChange={(e) => setCrop(e.target.value as CropId | "lead")}>
            <option value="lead">Lead crop of block</option>
            {CROP_IDS.map((c) => (
              <option key={c} value={c}>
                {t(`crop.${c}`)}
              </option>
            ))}
          </Select>
        </Field>
        <p className="ml-auto flex items-center gap-1.5 pb-2 text-[11.5px] text-muted">
          <Flame className="h-3.5 w-3.5 text-red-600" aria-hidden /> Priority block: score ≥ {PRIORITY_THRESHOLD}
        </p>
      </div>

      <TableFrame>
        <Table caption={`Blocks ranked by priority for week ${week}`} minWidth="860px">
          <THead>
            <tr>
              <Th className="w-10">#</Th>
              {header("name", "Block")}
              {header("district", "District")}
              {header("onset", "Onset %", true)}
              {header("break", "Dry spell % (≤2 wk)", true)}
              {header("heavy", "Heavy %", true)}
              {header("confidence", "Conf.", true)}
              <Th>Overall risk</Th>
              <Th>Sowing decision</Th>
              {header("priority", "Priority", true)}
            </tr>
          </THead>
          <tbody>
            {rows.map((r, i) => {
              const hot = r.priority >= PRIORITY_THRESHOLD;
              return (
                <tr key={r.id} className={`${TR} transition hover:bg-slate-50/80 ${hot ? "bg-red-50/50" : ""}`}>
                  <Td className="text-slate-400">{i + 1}</Td>
                  <RowTh>
                    <span className="flex items-center gap-1.5">
                      {hot && <Flame className="h-3.5 w-3.5 shrink-0 text-red-600" aria-label="Priority block" />}
                      {r.name}
                      {r.falseOnset && (
                        <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide text-red-700" title="Early rain followed by likely dry spell">
                          FALSE ONSET
                        </span>
                      )}
                    </span>
                  </RowTh>
                  <Td className="text-muted">{r.district}</Td>
                  <Td numeric>{r.onset}</Td>
                  <Td numeric className="font-semibold text-ink">
                    {r.break}
                  </Td>
                  <Td numeric>{r.heavy}</Td>
                  <Td numeric className="text-muted">
                    {r.confidence}
                  </Td>
                  <Td>
                    <RiskBadge level={r.risk} size="sm" />
                  </Td>
                  <Td>
                    <RiskBadge level={r.decisionSeverity} size="sm" label={r.decisionLabel} />
                  </Td>
                  <Td numeric>
                    <span
                      className={`inline-block min-w-9 rounded px-2 py-0.5 text-center text-[12px] font-bold tabular-nums ${hot ? "bg-red-600 text-white" : "bg-slate-100 text-body"}`}
                    >
                      {r.priority}
                    </span>
                  </Td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-10 text-center text-[13px] text-muted">
                  No blocks match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </TableFrame>
    </div>
  );
}
