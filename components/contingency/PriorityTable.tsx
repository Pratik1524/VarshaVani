"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, CloudLightning, Download, OctagonAlert, SearchCheck } from "lucide-react";
import type { CropId } from "@/types";
import type { PlannerFilters, RankedBlock } from "@/lib/contingency";
import { downloadCsv, toCsv } from "@/lib/csv";
import { RISK_CLASSES } from "@/lib/riskColors";
import { TR } from "@/lib/ui";
import { blockName } from "@/data/blocks";
import { tc, type ContingencyKey } from "@/lib/i18n/contingency";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { RowTh, Table, TableFrame, Td, Th, THead } from "@/components/ui/Table";
import { InfoPopover } from "./InfoPopover";
import { num, usePlannerText } from "./usePlannerText";

type SortKey = "rank" | "block" | "risk" | "prob" | "conf" | "area";

const SORTERS: Record<SortKey, (a: RankedBlock, b: RankedBlock) => number> = {
  rank: (a, b) => a.rank - b.rank,
  block: (a, b) => a.block.name.localeCompare(b.block.name),
  risk: (a, b) => a.mainRisk.localeCompare(b.mainRisk) || a.rank - b.rank,
  prob: (a, b) => a.mainProb - b.mainProb,
  conf: (a, b) => a.avgConfidence - b.avgConfidence,
  area: (a, b) => a.cropAreaHa - b.cropAreaHa,
};

export function PriorityTable({ rows, filters, crop }: { rows: RankedBlock[]; filters: PlannerFilters; crop: CropId }) {
  const { c, t, lang } = usePlannerText();
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "rank", dir: 1 });

  const sorted = useMemo(() => [...rows].sort((a, b) => SORTERS[sort.key](a, b) * sort.dir), [rows, sort]);

  const toggle = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === "block" || key === "rank" || key === "risk" ? 1 : -1 }));

  const riskLabel = (r: RankedBlock) => (r.mainRisk === "dry" ? c("riskDry") : c("riskHeavy"));
  const action = (r: RankedBlock) => c(`action_${r.action}` as ContingencyKey);

  // CSV stays in English so it opens cleanly in any spreadsheet.
  const tcEn = (r: RankedBlock) => tc("en", `action_${r.action}` as ContingencyKey);

  const exportCsv = () => {
    downloadCsv(
      `varshavani-contingency-${filters.district === "all" ? "all" : filters.district.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${filters.crop}-w1-${filters.horizon}.csv`,
      toCsv(
        ["rank", "block", "district", "main_risk", "probability_pct", "confidence_pct", "crop_area_ha", "rank_score", "recommended_action"],
        sorted.map((r) => [r.rank, r.block.name, r.block.district, r.mainRisk, r.mainProb, r.avgConfidence, r.cropAreaHa, r.rankScore, tcEn(r)]),
      ),
    );
  };

  const head = (key: SortKey, label: string, numeric = false, className = "") => {
    const on = sort.key === key;
    const Icon = on ? (sort.dir === 1 ? ArrowUp : ArrowDown) : ArrowUpDown;
    return (
      <Th numeric={numeric} className={className} aria-sort={on ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
        <button
          type="button"
          onClick={() => toggle(key)}
          aria-label={c("sortBy", { col: label })}
          className={`inline-flex items-center gap-1 uppercase tracking-[0.07em] transition hover:text-ink ${numeric ? "flex-row-reverse" : ""} ${on ? "text-ink" : ""}`}
        >
          {label}
          <Icon className={`h-3 w-3 ${on ? "" : "opacity-40"}`} aria-hidden />
        </button>
      </Th>
    );
  };

  const why = (r: RankedBlock) => {
    const week = r.mainRisk === "dry" ? r.breakWeek : r.heavyWeek;
    return (
      <InfoPopover label={c("why")} closeLabel={t("common.close")}>
        <p className="font-semibold text-ink">{c("whyFormula")}</p>
        <p className="mt-1.5 rounded-control bg-slate-50 px-2 py-1.5 font-mono text-[11.5px] text-ink ring-1 ring-line">
          {c("whyCalc", { p: r.mainProb, c: r.avgConfidence, a: num(r.cropAreaHa), s: num(r.rankScore) })}
        </p>
        <ul className="mt-2 space-y-1">
          <li>• {c("whyRel", { r: r.relScore })}</li>
          <li>
            • {riskLabel(r)} {r.mainProb}% · {t(`crop.${crop}`)} {num(r.cropAreaHa)} ha
          </li>
          {week && <li>• {c("whyWeek", { n: week })}</li>}
          <li>• {c("whyIrr", { p: r.block.irrigatedPct })}</li>
        </ul>
      </InfoPopover>
    );
  };

  const SORT_LABEL: Record<SortKey, string> = {
    rank: c("colRank"),
    block: c("colBlock"),
    risk: c("colRisk"),
    prob: c("colProb"),
    conf: c("colConf"),
    area: c("colArea"),
  };

  if (!rows.length) return <EmptyState title={c("noRisk")} description={c("noRiskSub")} icon={SearchCheck} />;

  return (
    <div>
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 md:justify-end">
        {/* Phones: sort menu instead of clickable headers */}
        <label className="flex items-center gap-2 text-[12.5px] font-semibold text-ink md:hidden">
          {c("sortLabel")}
          <select
            value={`${sort.key}:${sort.dir}`}
            onChange={(e) => {
              const [key, dir] = e.target.value.split(":");
              setSort({ key: key as SortKey, dir: Number(dir) as 1 | -1 });
            }}
            className="min-h-9 rounded-control border border-line bg-white pl-2.5 text-[12.5px]"
          >
            {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => {
              const dir = k === "block" || k === "rank" || k === "risk" ? 1 : -1;
              return (
                <option key={k} value={`${k}:${dir}`}>
                  {SORT_LABEL[k]}
                </option>
              );
            })}
          </select>
        </label>
        <Button variant="secondary" size="sm" icon={Download} onClick={exportCsv}>
          {c("exportCsv")}
        </Button>
      </div>

      {/* Phones: one card per block */}
      <ol className="space-y-2.5 md:hidden">
        {sorted.map((r) => {
          const cls = RISK_CLASSES[r.level];
          const RiskIcon = r.mainRisk === "dry" ? OctagonAlert : CloudLightning;
          return (
            <li key={r.block.id} className="rounded-card border border-line bg-white p-3.5 shadow-soft">
              <div className="flex items-start gap-3">
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-bold ${r.rank <= 3 ? "bg-monsoon-800 text-white" : "bg-slate-100 text-body"}`}>
                  {r.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold leading-snug text-ink">{blockName(r.block, lang)}</p>
                  <p className="text-[11.5px] text-muted">{r.block.district}</p>
                </div>
                <span className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cls.bg} ${cls.text} ${cls.border}`}>
                  <RiskIcon className="h-3.5 w-3.5" aria-hidden />
                  {riskLabel(r)}
                </span>
              </div>
              <dl className="mt-2.5 grid grid-cols-3 gap-2 text-center">
                {[
                  [c("colProb"), `${r.mainProb}%`],
                  [c("colConf"), `${r.avgConfidence}%`],
                  [c("colArea"), `${num(r.cropAreaHa)} ha`],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-control bg-slate-50 px-1.5 py-1.5 ring-1 ring-line">
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted">{k}</dt>
                    <dd className="mt-0.5 text-[13px] font-bold tabular-nums text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-2.5 flex items-center justify-between gap-2">
                <p className="text-[12.5px] leading-snug text-body">
                  <span className="font-semibold text-ink">{c("colAction")}:</span> {action(r)}
                </p>
                {why(r)}
              </div>
            </li>
          );
        })}
      </ol>

      {/* `relative` keeps the sr-only header text inside the scroll area. */}
      <TableFrame className="relative hidden md:block">
        <Table caption={c("rankTitle")} minWidth="820px">
          <THead>
            <tr>
              {head("rank", c("colRank"), false, "w-16")}
              {head("block", c("colBlock"))}
              {head("risk", c("colRisk"))}
              {head("prob", c("colProb"), true)}
              {head("conf", c("colConf"), true)}
              {head("area", c("colArea"), true)}
              <Th>{c("colAction")}</Th>
              <Th className="w-12">
                <span className="sr-only">{c("why")}</span>
              </Th>
            </tr>
          </THead>
          <tbody>
            {sorted.map((r) => {
              const cls = RISK_CLASSES[r.level];
              const RiskIcon = r.mainRisk === "dry" ? OctagonAlert : CloudLightning;
              return (
                <tr key={r.block.id} className={`${TR} transition-colors hover:bg-slate-50/80`}>
                  <Td>
                    <span
                      className={`grid h-7 w-7 place-items-center rounded-full text-[12px] font-bold ${r.rank <= 3 ? "bg-monsoon-800 text-white" : "bg-slate-100 text-body"}`}
                    >
                      {r.rank}
                    </span>
                  </Td>
                  <RowTh>
                    {blockName(r.block, lang)}
                    <span className="block text-[11.5px] font-normal text-muted">{r.block.district}</span>
                  </RowTh>
                  <Td>
                    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11.5px] font-semibold ${cls.bg} ${cls.text} ${cls.border}`}>
                      <RiskIcon className="h-3.5 w-3.5" aria-hidden />
                      {riskLabel(r)}
                    </span>
                  </Td>
                  <Td numeric>
                    <span className="inline-flex items-center justify-end gap-2">
                      <span className="hidden h-1.5 w-12 overflow-hidden rounded-full bg-slate-100 sm:block" aria-hidden>
                        <span className="block h-full rounded-full" style={{ width: `${r.mainProb}%`, background: r.mainRisk === "dry" ? "#f97316" : "#1f5592" }} />
                      </span>
                      <span className="font-semibold text-ink">{r.mainProb}%</span>
                    </span>
                  </Td>
                  <Td numeric>{r.avgConfidence}%</Td>
                  <Td numeric>{num(r.cropAreaHa)} ha</Td>
                  <Td>
                    <span className="flex items-center gap-2">
                      <RiskBadge level={r.level} size="sm" label={t(`risk.${r.level}`)} className="hidden xl:inline-flex" />
                      <span className="text-[12.5px] text-body">{action(r)}</span>
                    </span>
                  </Td>
                  <Td>{why(r)}</Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </TableFrame>
    </div>
  );
}
