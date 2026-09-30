"use client";

import { useState } from "react";
import {
  CircleCheck,
  CloudRain,
  Download,
  Droplets,
  LayoutDashboard,
  Map as MapIcon,
  Megaphone,
  OctagonAlert,
  Send,
  ShieldAlert,
  ThumbsUp,
} from "lucide-react";
import type { Layer, Week } from "@/types";
import { WEEKS } from "@/types";
import { BLOCKS } from "@/data/blocks";
import { getAllForecasts } from "@/lib/forecastService";
import { PRIORITY_THRESHOLD, blockDecision, breakNear, priorityScore, riskFlags, type FlagKind } from "@/lib/priority";
import { downloadCsv, toCsv } from "@/lib/csv";
import { fmtRange } from "@/lib/i18n";
import { useAsync } from "@/hooks/useAsync";
import { useFeedbackLog, useMessageLog } from "@/hooks/useCommunityData";
import { useAppStore } from "@/lib/store";
import { TR } from "@/lib/ui";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, PageTitle, SectionHeading } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { RowTh, Table, TableFrame, Td, Th, THead } from "@/components/ui/Table";
import { Segmented } from "@/components/ui/Segmented";
import { CardSkeleton, ErrorState, Skeleton } from "@/components/ui/States";
import { LAYER_ICON } from "@/components/ui/ProbabilityBar";
import { BlockMap } from "@/components/map/BlockMap";
import { MapLegend } from "@/components/map/MapLegend";
import { BlocksTable } from "@/components/officer/BlocksTable";
import { AnalyticsCharts } from "@/components/officer/AnalyticsCharts";

const FLAG_ICON: Record<FlagKind, typeof ShieldAlert> = { insurance_dry: ShieldAlert, insurance_flood: CloudRain, irrigation: Droplets };
const FLAG_META: Record<FlagKind, { short: string; cls: string }> = {
  insurance_dry: { short: "Insurance: dry spell", cls: "border-sun-200 bg-sun-50 text-sun-600" },
  insurance_flood: { short: "Insurance: inundation", cls: "border-orange-200 bg-orange-50 text-orange-800" },
  irrigation: { short: "Irrigation planning", cls: "border-monsoon-200 bg-monsoon-50 text-monsoon-800" },
};

export default function OfficerDashboard() {
  const user = useAppStore((s) => s.user);
  const [week, setWeek] = useState<Week>(1);
  const [layer, setLayer] = useState<Layer>("break");
  const [selected, setSelected] = useState<string | null>(null);
  const { data: forecasts, error, reload } = useAsync(getAllForecasts, "all-forecasts");
  const { messages } = useMessageLog();
  const { feedback } = useFeedbackLog();

  if (error) return <ErrorState onRetry={reload} />;

  const highBreak = forecasts ? BLOCKS.filter((b) => breakNear(forecasts[b.id], week) >= 65).length : 0;
  const safe = forecasts ? BLOCKS.filter((b) => blockDecision(b, forecasts[b.id], week).decision === "sow").length : 0;
  const sent = messages.reduce((s, m) => s + m.recipients, 0);
  const usefulPct = feedback.length ? Math.round((feedback.filter((f) => f.useful).length / feedback.length) * 100) : 0;

  const flags = forecasts ? BLOCKS.flatMap((b) => riskFlags(b, forecasts[b.id])) : [];
  const priority = forecasts
    ? BLOCKS.map((b) => ({ b, score: priorityScore(b, forecasts[b.id], week) }))
        .filter((x) => x.score >= PRIORITY_THRESHOLD)
        .sort((a, b) => b.score - a.score)
    : [];

  const exportCsv = () => {
    if (!forecasts) return;
    const rows = BLOCKS.map((b) => {
      const f = forecasts[b.id];
      const w = f.weeks[week - 1];
      const fl = riskFlags(b, f);
      return [
        b.name,
        b.district,
        b.zone,
        w.startDate,
        w.onset,
        breakNear(f, week),
        w.heavyRain,
        w.confidence,
        priorityScore(b, f, week),
        f.falseOnsetRisk ? "yes" : "no",
        b.irrigatedPct,
        fl.map((x) => x.label).join("; "),
      ];
    })
      .filter((r) => (r[8] as number) >= PRIORITY_THRESHOLD || (r[11] as string).length > 0)
      .sort((a, b) => (b[8] as number) - (a[8] as number));
    downloadCsv(
      `varshavani-priority-blocks-week${week}.csv`,
      toCsv(
        ["block", "district", "zone", "week_start", "onset_pct", "dry_spell_pct_2wk", "heavy_rain_pct", "confidence", "priority_score", "false_onset", "irrigated_pct", "flags"],
        rows,
      ),
    );
  };

  const w0 = forecasts ? forecasts[BLOCKS[0].id].weeks[week - 1] : undefined;

  return (
    <div className="mx-auto max-w-[1500px] space-y-7">
      <PageTitle
        icon={LayoutDashboard}
        title="Extension officer dashboard"
        subtitle={`${user?.jurisdiction ?? ""} · Forecast issued 12 Jun 2026`}
        meta={w0 ? `Showing week ${week}: ${fmtRange("en", w0.startDate, w0.endDate)}` : undefined}
        action={
          <>
            <Segmented<Week> label="Forecast week" value={week} onChange={setWeek} options={WEEKS.map((w) => ({ value: w, label: `Week ${w}` }))} />
            <ButtonLink href="/officer/campaign" variant="navy" icon={Megaphone}>
              New campaign
            </ButtonLink>
          </>
        }
      />

      {/* KPIs */}
      <section aria-label="Key indicators" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Blocks at high dry-spell risk" value={forecasts ? highBreak : "–"} hint={`Chance ≥ 65% within 2 weeks · of ${BLOCKS.length}`} icon={OctagonAlert} tone="red" />
        <StatCard label="Blocks safe to sow (lead crop)" value={forecasts ? safe : "–"} hint="Advisory engine decision = sow" icon={CircleCheck} tone="green" />
        <StatCard label="Advisories delivered" value={sent.toLocaleString("en-IN")} hint={`${messages.length} campaigns (SMS + WhatsApp)`} icon={Send} tone="blue" />
        <StatCard label="Farmer feedback score" value={`${usefulPct}%`} hint={`${feedback.length} ratings · rated useful`} icon={ThumbsUp} tone="amber" />
      </section>

      {/* Map + priority list */}
      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card pad>
          <CardHeader
            icon={MapIcon}
            title="Risk heatmap"
            subtitle="Click a block to highlight it"
            as="h2"
            action={
              <Segmented<Layer>
                size="sm"
                label="Map layer"
                value={layer}
                onChange={setLayer}
                options={(["onset", "break", "heavy"] as Layer[]).map((l) => {
                  const Icon = LAYER_ICON[l];
                  return { value: l, label: <><Icon className="h-3.5 w-3.5" aria-hidden /> {l === "break" ? "Dry spell" : l === "heavy" ? "Heavy rain" : "Onset"}</> };
                })}
              />
            }
          />
          <div className="relative mt-4" data-map-frame>
            {forecasts ? (
              <BlockMap
                blocks={BLOCKS}
                forecasts={forecasts}
                layer={layer}
                week={week}
                selectedId={selected}
                onSelect={setSelected}
                emphasizeSelected
                markerStyle="dot"
                fullscreenButton
                className="h-[440px]"
              />
            ) : (
              <Skeleton className="h-[440px]" />
            )}
            <div className="absolute bottom-3 left-3 z-[500]">
              <MapLegend layer={layer} />
            </div>
          </div>
        </Card>

        <Card pad>
          <CardHeader title="Priority blocks" subtitle={`Score ≥ ${PRIORITY_THRESHOLD} · act first`} icon={OctagonAlert} as="h2" />
          {!forecasts ? (
            <div className="mt-4 space-y-2">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : (
            <ol className="mt-4 max-h-[440px] space-y-2 overflow-y-auto pr-1">
              {priority.map(({ b, score }, i) => {
                const f = forecasts[b.id];
                return (
                  <li key={b.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(b.id)}
                      className={`flex w-full items-center gap-3 rounded-control border p-2.5 text-left transition hover:border-red-300 hover:bg-red-50/40 ${
                        selected === b.id ? "border-red-300 bg-red-50" : "border-line"
                      }`}
                    >
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded bg-red-600 text-[12px] font-bold text-white">{i + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-semibold text-ink">
                          {b.name} <span className="font-normal text-muted">· {b.district}</span>
                        </span>
                        <span className="block text-[11.5px] text-muted">
                          Dry spell {breakNear(f, week)}% · Irrigated {b.irrigatedPct}% {f.falseOnsetRisk && "· false-onset pattern"}
                        </span>
                      </span>
                      <span className="text-[15px] font-bold tabular-nums text-red-700">{score}</span>
                    </button>
                  </li>
                );
              })}
              {priority.length === 0 && <li className="py-4 text-center text-[13px] text-muted">No priority blocks this week.</li>}
            </ol>
          )}
        </Card>
      </section>

      {/* Ranking table */}
      <section aria-labelledby="ranking">
        <SectionHeading id="ranking" title="Block ranking" description={`All ${BLOCKS.length} demo blocks, sortable and filterable`} />
        {forecasts ? <BlocksTable forecasts={forecasts} week={week} /> : <CardSkeleton lines={8} />}
      </section>

      {/* Flags */}
      <section aria-labelledby="flags">
        <SectionHeading
          id="flags"
          title="Insurance & irrigation flags"
          description="PMFBY-style triggers and irrigation planning (illustrative thresholds, all 4 weeks)"
          action={
            <Button variant="secondary" onClick={exportCsv} disabled={!forecasts} icon={Download}>
              Export priority blocks (CSV)
            </Button>
          }
        />
        <div className="mb-3 flex flex-wrap gap-2">
          {(Object.keys(FLAG_META) as FlagKind[]).map((k) => {
            const Icon = FLAG_ICON[k];
            return (
              <span key={k} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-semibold ${FLAG_META[k].cls}`}>
                <Icon className="h-3.5 w-3.5" aria-hidden /> {FLAG_META[k].short}: {flags.filter((f) => f.kind === k).length} blocks
              </span>
            );
          })}
        </div>
        <TableFrame>
          <Table caption="Blocks with insurance or irrigation flags" minWidth="720px">
            <THead>
              <tr>
                <Th>Block</Th>
                <Th>Flags</Th>
                <Th>Suggested action</Th>
              </tr>
            </THead>
            <tbody>
              {BLOCKS.filter((b) => flags.some((f) => f.blockId === b.id)).map((b) => {
                const bf = flags.filter((f) => f.blockId === b.id);
                return (
                  <tr key={b.id} className={`${TR} align-top transition hover:bg-slate-50/80`}>
                    <RowTh className="align-top">
                      {b.name}
                      <span className="block text-[11.5px] font-normal text-muted">
                        {b.district} · irrigated {b.irrigatedPct}%
                      </span>
                    </RowTh>
                    <Td className="align-top">
                      <div className="flex flex-wrap gap-1.5">
                        {bf.map((f) => {
                          const Icon = FLAG_ICON[f.kind];
                          return (
                            <span key={f.kind} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${FLAG_META[f.kind].cls}`}>
                              <Icon className="h-3 w-3" aria-hidden /> {FLAG_META[f.kind].short}
                            </span>
                          );
                        })}
                      </div>
                    </Td>
                    <Td className="align-top">
                      {bf.map((f) => (
                        <p key={f.kind}>{f.detail}</p>
                      ))}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </TableFrame>
      </section>

      {/* Analytics */}
      <section aria-labelledby="analytics">
        <SectionHeading id="analytics" title="Advisory analytics" description="Delivery reach and farmer-reported usefulness" />
        <AnalyticsCharts messages={messages} feedback={feedback} />
      </section>
    </div>
  );
}
