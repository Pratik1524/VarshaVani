"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Home, MousePointerClick, Pause, Play, Search } from "lucide-react";
import type { Layer, Week } from "@/types";
import { WEEKS } from "@/types";
import { BLOCKS, BLOCK_BY_ID, blockName } from "@/data/blocks";
import { getAllForecasts, getDrivers } from "@/lib/forecastService";
import { fmtRange } from "@/lib/i18n";
import { useAsync } from "@/hooks/useAsync";
import { useT } from "@/hooks/useT";
import { SURFACE, SURFACE_DASHED } from "@/lib/ui";
import { Segmented } from "@/components/ui/Segmented";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { LAYER_ICON } from "@/components/ui/ProbabilityBar";
import { ErrorState, Skeleton } from "@/components/ui/States";
import { BlockMap } from "./BlockMap";
import { MapLegend } from "./MapLegend";
import { BlockDetailsPanel } from "./BlockDetailsPanel";
import { BlockSummaryCard } from "./BlockSummaryCard";

interface Props {
  initialBlockId?: string;
  initialLayer?: Layer;
  mapClassName?: string;
  /** Farmer view: offer "set as my block". */
  onSetHome?: (blockId: string) => void;
  homeBlockId?: string;
  /** Stack panel below map even on large screens (narrow layouts). */
  stacked?: boolean;
  /** Circular markers with hover labels (see BlockMap `markerStyle`). */
  markerStyle?: "cell" | "dot";
  /** Show the full-screen button on the map. */
  fullscreenButton?: boolean;
  /** Show a short description of the selected block below the map. */
  summaryBelowMap?: boolean;
}

/**
 * Main risk map: layer toggle, week selector with play animation, search,
 * legend, and a details panel for the selected block.
 */
export function RiskMapExplorer({
  initialBlockId,
  initialLayer = "break",
  mapClassName = "h-[440px] lg:h-[600px]",
  onSetHome,
  homeBlockId,
  stacked = false,
  markerStyle,
  fullscreenButton = false,
  summaryBelowMap = false,
}: Props) {
  const { t, lang } = useT();
  const [layer, setLayer] = useState<Layer>(initialLayer);
  const [week, setWeek] = useState<Week>(1);
  const [playing, setPlaying] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(initialBlockId ?? null);
  // Only pan/zoom after an explicit search/select, so the whole state stays visible initially.
  const [focusId, setFocusId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const forecasts = useAsync(getAllForecasts, "all-forecasts");
  const drivers = useAsync(getDrivers, "drivers");

  // Week animation: step 1 -> 4 and loop while playing.
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => setWeek((w) => ((w % 4) + 1) as Week), 1400);
    return () => window.clearInterval(id);
  }, [playing]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return BLOCKS.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        blockName(b, "mr").includes(query.trim()) ||
        b.district.toLowerCase().includes(q) ||
        b.villages.some((v) => v.toLowerCase().includes(q)),
    ).slice(0, 6);
  }, [query]);

  const choose = (id: string) => {
    setSelectedId(id);
    setFocusId(id);
    setQuery("");
  };

  const selected = selectedId ? BLOCK_BY_ID[selectedId] : undefined;
  const sampleWeek = forecasts.data ? Object.values(forecasts.data)[0]?.weeks[week - 1] : undefined;

  return (
    <div className={`grid gap-4 ${stacked ? "" : "lg:grid-cols-[1fr_380px]"}`}>
      <div className="space-y-3">
        {/* Controls */}
        <div className={`flex flex-wrap items-center gap-2 p-2.5 ${SURFACE}`}>
          <Segmented<Layer>
            label={t("map.layer")}
            value={layer}
            onChange={setLayer}
            stretch
            className="w-full sm:w-auto"
            options={(["onset", "break", "heavy"] as Layer[]).map((l) => {
              const Icon = LAYER_ICON[l];
              return {
                value: l,
                label: (
                  <span className="flex flex-col items-center gap-0.5 text-center text-[11.5px] leading-tight sm:flex-row sm:gap-1.5 sm:whitespace-nowrap sm:text-[13px]">
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    {t(`layer.${l}`)}
                  </span>
                ),
              };
            })}
          />
          <div className="flex items-center gap-1.5">
            <Segmented<Week>
              label={t("map.week")}
              value={week}
              onChange={(w) => {
                setPlaying(false);
                setWeek(w);
              }}
              options={WEEKS.map((w) => ({ value: w, label: t("common.weekShort", { n: w }), ariaLabel: t("common.week", { n: w }) }))}
            />
            <Button variant="navy" onClick={() => setPlaying((p) => !p)} aria-pressed={playing} icon={playing ? Pause : Play}>
              <span className="hidden sm:inline">{playing ? t("map.pause") : t("map.play")}</span>
            </Button>
          </div>

          <div className="relative min-w-48 flex-1">
            <label htmlFor="block-search" className="sr-only">
              {t("common.search")}
            </label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <Input
              id="block-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("common.search")}
              autoComplete="off"
              aria-controls="block-search-results"
              className="pl-9"
            />
            {query && (
              <ul id="block-search-results" className="absolute z-[1100] mt-1 w-full overflow-hidden rounded-control border border-line bg-white shadow-lift">
                {results.length === 0 && <li className="px-3 py-2 text-[13px] text-muted">{t("common.noResults")}</li>}
                {results.map((b) => (
                  <li key={b.id}>
                    <button type="button" onClick={() => choose(b.id)} className="block w-full px-3 py-2 text-left text-[13px] transition hover:bg-leaf-50">
                      <span className="font-semibold text-ink">{blockName(b, lang)}</span>{" "}
                      <span className="text-muted">
                        · {b.district} · {b.villages.slice(0, 2).join(", ")}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {sampleWeek && (
          <p className="px-1 text-[12.5px] font-medium text-muted" aria-live="polite">
            {t("common.week", { n: week })}: {fmtRange(lang, sampleWeek.startDate, sampleWeek.endDate)} · {t(`layer.${layer}`)}
          </p>
        )}

        {/* Map */}
        <div className="relative" data-map-frame>
          {forecasts.error ? (
            <ErrorState onRetry={forecasts.reload} />
          ) : forecasts.data ? (
            <BlockMap
              blocks={BLOCKS}
              forecasts={forecasts.data}
              layer={layer}
              week={week}
              selectedId={selectedId}
              focusId={focusId}
              onSelect={(id) => setSelectedId(id)}
              className={mapClassName}
              labelFor={(b) => blockName(b, lang)}
              layerLabel={t(`layer.${layer}`)}
              markerStyle={markerStyle}
              fullscreenButton={fullscreenButton}
            />
          ) : (
            <Skeleton className={`w-full ${mapClassName}`} />
          )}
          <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-[500] sm:right-auto">
            <div className="pointer-events-auto">
              <MapLegend layer={layer} />
            </div>
          </div>
        </div>

        {/* Keyboard / screen-reader alternative to clicking polygons */}
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="block-select" className="text-[12.5px] font-medium text-muted">
            {t("common.block")}:
          </label>
          <Select id="block-select" value={selectedId ?? ""} onChange={(e) => e.target.value && choose(e.target.value)} className="w-auto">
            <option value="">{t("map.tap")}</option>
            {BLOCKS.map((b) => (
              <option key={b.id} value={b.id}>
                {blockName(b, lang)} ({b.district})
              </option>
            ))}
          </Select>
        </div>

        {summaryBelowMap && (
          <BlockSummaryCard block={selected} forecast={selected ? forecasts.data?.[selected.id] : undefined} layer={layer} week={week} />
        )}
      </div>

      {/* Details */}
      <div className="space-y-3">
        {selected && forecasts.data && drivers.data ? (
          <>
            <BlockDetailsPanel
              block={selected}
              forecast={forecasts.data[selected.id]}
              drivers={drivers.data}
              week={week}
              onClose={() => setSelectedId(null)}
            />
            {onSetHome && (
              <Button
                variant="secondary"
                size="lg"
                disabled={homeBlockId === selected.id}
                onClick={() => onSetHome(selected.id)}
                icon={homeBlockId === selected.id ? Check : Home}
                className="w-full"
              >
                {homeBlockId === selected.id ? t("common.selectBlock") : `${t("common.selectBlock")}: ${blockName(selected, lang)}`}
              </Button>
            )}
          </>
        ) : (
          <div className={`grid min-h-40 place-items-center p-6 text-center text-[13px] font-medium text-muted ${SURFACE_DASHED}`}>
            <span className="flex flex-col items-center gap-2">
              <MousePointerClick className="h-6 w-6 text-slate-300" aria-hidden />
              {t("map.tap")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
