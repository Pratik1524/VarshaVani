"use client";

/**
 * Leaflet map of block cells coloured by risk. Loaded ONLY on the client via
 * next/dynamic (see BlockMap.tsx) because Leaflet touches `window`.
 */
import "leaflet/dist/leaflet.css";
import { Fragment, useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { CircleMarker, MapContainer, Marker, Polygon, TileLayer, Tooltip, useMap } from "react-leaflet";
import L, { type LatLngBoundsExpression, type LatLngExpression } from "leaflet";
import { Map as MapIcon, Maximize2, Minimize2, Satellite } from "lucide-react";
import type { Block, BlockForecast, Layer, RiskLevel, Week } from "@/types";
import { RISK_HEX, riskForLayer } from "@/lib/riskColors";
import { useT } from "@/hooks/useT";

export interface BlockMapProps {
  blocks: Block[];
  forecasts: Record<string, BlockForecast>;
  layer: Layer;
  week: Week;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** Block to pan/zoom to (e.g. after search). */
  focusId?: string | null;
  className?: string;
  labelFor?: (b: Block) => string;
  layerLabel?: string;
  /**
   * Make the selected block stand out: other cells fade back, the selection
   * gets a white halo, a soft pulse and a name label, and the map pans to it.
   */
  emphasizeSelected?: boolean;
  /**
   * "dot" draws each block as a bright circular marker with a smooth hover
   * name label and keyboard focus. Default "cell" keeps the block cells.
   */
  markerStyle?: "cell" | "dot";
  /**
   * Show a full-screen button (top-right). It enlarges the closest
   * `[data-map-frame]` ancestor (so overlays such as the legend come along),
   * or the map itself when there is none.
   */
  fullscreenButton?: boolean;
}

/** Brighter fills for the circular markers (same hue family as RISK_HEX). */
const DOT_HEX: Record<RiskLevel, string> = {
  low: "#22c55e",
  watch: "#facc15",
  elevated: "#fb923c",
  high: "#ef4444",
};
const DOT_RADIUS = 10;
const DOT_RADIUS_SELECTED = 13;

/** Soft pulsing ring around the selected circular marker. */
const DOT_RING_ICON = L.divIcon({
  className: "mm-pulse-icon mm-dot-ring",
  html: '<span class="mm-pulse-ring"></span>',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

interface DotMarkerProps {
  block: Block;
  color: string;
  selected: boolean;
  dimmed: boolean;
  falseOnset: boolean;
  hovered: boolean;
  name: string;
  detail: string;
  ariaLabel: string;
  onHover: (id: string | null) => void;
  onSelect?: (id: string) => void;
}

/**
 * One circular block marker. The SVG circle is made keyboard-focusable
 * (Tab, then Enter/Space selects) and shows the same name label on focus as
 * on hover. The label is always mounted and faded in/out with CSS so both
 * the entrance and the exit are smooth.
 */
function DotMarker({ block, color, selected, dimmed, falseOnset, hovered, name, detail, ariaLabel, onHover, onSelect }: DotMarkerProps) {
  const ref = useRef<L.CircleMarker | null>(null);

  // Keyboard + focus wiring on the rendered SVG path.
  useEffect(() => {
    const el = ref.current?.getElement() as SVGElement | undefined;
    if (!el) return;
    el.setAttribute("tabindex", "0");
    el.setAttribute("role", "button");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect?.(block.id);
      }
    };
    const onFocus = () => onHover(block.id);
    const onBlur = () => onHover(null);
    el.addEventListener("keydown", onKey);
    el.addEventListener("focus", onFocus);
    el.addEventListener("blur", onBlur);
    return () => {
      el.removeEventListener("keydown", onKey);
      el.removeEventListener("focus", onFocus);
      el.removeEventListener("blur", onBlur);
    };
  }, [block.id, onHover, onSelect]);

  useEffect(() => {
    const el = ref.current?.getElement() as SVGElement | undefined;
    if (!el) return;
    el.setAttribute("aria-label", ariaLabel);
    el.setAttribute("aria-pressed", String(selected));
    el.classList.toggle("is-selected", selected);
    el.classList.toggle("is-hover", hovered && !selected);
    // Keep the selected marker above its neighbours.
    if (selected) ref.current?.bringToFront();
  }, [ariaLabel, selected, hovered]);

  return (
    <CircleMarker
      ref={ref}
      center={[block.lat, block.lng]}
      radius={selected ? DOT_RADIUS_SELECTED : DOT_RADIUS}
      pathOptions={{
        className: "mm-dot",
        color: selected ? "#0b1d33" : falseOnset ? "#7f1d1d" : "#ffffff",
        weight: selected ? 3 : 2,
        dashArray: falseOnset && !selected ? "3 2" : undefined,
        fillColor: color,
        fillOpacity: dimmed ? 0.62 : 0.96,
        opacity: dimmed ? 0.7 : 1,
      }}
      eventHandlers={{
        click: () => onSelect?.(block.id),
        mouseover: () => onHover(block.id),
        mouseout: () => onHover(null),
      }}
    >
      <Tooltip permanent direction="right" offset={[DOT_RADIUS + 4, 0]} opacity={1} interactive={false} className="mm-hover-tip">
        <span className={`mm-hover-label ${hovered && !selected ? "is-on" : ""}`} aria-hidden>
          <span className="mm-hover-swatch" style={{ backgroundColor: color }} />
          <span>
            <strong>{name}</strong>
            <span className="mm-hover-sub">{detail}</span>
          </span>
        </span>
      </Tooltip>
    </CircleMarker>
  );
}

/** After the map box changes size, re-measure and frame the demo region again. */
function refitMap(map: L.Map | null) {
  window.setTimeout(() => {
    if (!map) return;
    map.invalidateSize({ pan: false });
    map.fitBounds(MAHARASHTRA_BOUNDS, { padding: [8, 8], animate: true });
  }, 80);
}

/** Full-screen toggle (Fullscreen API, with a fixed-overlay fallback e.g. iPhone Safari). */
function FullscreenButton({ wrapRef, mapRef }: { wrapRef: RefObject<HTMLDivElement | null>; mapRef: RefObject<L.Map | null> }) {
  const { t } = useT();
  const [on, setOn] = useState(false);

  const target = () => wrapRef.current?.closest<HTMLElement>("[data-map-frame]") ?? wrapRef.current;
  const refit = () => refitMap(mapRef.current);

  useEffect(() => {
    const onChange = () => {
      const el = wrapRef.current?.closest<HTMLElement>("[data-map-frame]") ?? wrapRef.current;
      setOn(!!el && document.fullscreenElement === el);
      refitMap(mapRef.current);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [wrapRef, mapRef]);

  // Esc closes the fallback overlay (the real Fullscreen API handles Esc itself).
  useEffect(() => {
    if (!on) return;
    const el = wrapRef.current?.closest<HTMLElement>("[data-map-frame]") ?? wrapRef.current;
    if (!el?.classList.contains("mm-map-pseudo-fs")) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      el.classList.remove("mm-map-pseudo-fs");
      setOn(false);
      refitMap(mapRef.current);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [on, wrapRef, mapRef]);

  const toggle = () => {
    const el = target();
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    if (el.classList.contains("mm-map-pseudo-fs")) {
      el.classList.remove("mm-map-pseudo-fs");
      setOn(false);
      refit();
      return;
    }
    if (document.fullscreenEnabled && el.requestFullscreen) {
      el.requestFullscreen().catch(() => {
        el.classList.add("mm-map-pseudo-fs");
        setOn(true);
        refit();
      });
    } else {
      el.classList.add("mm-map-pseudo-fs");
      setOn(true);
      refit();
    }
  };

  const label = on ? t("map.exitFullscreen") : t("map.fullscreen");
  const Icon = on ? Minimize2 : Maximize2;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      aria-pressed={on}
      title={label}
      className="group absolute right-2.5 top-[54px] z-[500] grid h-9 w-9 place-items-center rounded-control border border-line bg-white/95 text-body shadow-raise backdrop-blur transition hover:bg-white hover:text-monsoon-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-monsoon-600"
    >
      <Icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" aria-hidden />
    </button>
  );
}

const PULSE_ICON = L.divIcon({
  className: "mm-pulse-icon",
  html: '<span class="mm-pulse-ring"></span><span class="mm-pulse-dot"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

/** Gently bring the selected block into view if it is near or past the edge. */
function PanIntoView({ block }: { block?: Block }) {
  const map = useMap();
  useEffect(() => {
    if (!block) return;
    const inner = map.getBounds().pad(-0.18);
    if (!inner.contains([block.lat, block.lng])) map.panTo([block.lat, block.lng], { animate: true, duration: 0.6 });
  }, [block, map]);
  return null;
}

/** Tight bounds around the demo blocks (Maharashtra). */
const MAHARASHTRA_BOUNDS: LatLngBoundsExpression = [
  [15.75, 72.6],
  [21.45, 79.5],
];

const FIELD = { onset: "onset", break: "breakProb", heavy: "heavyRain" } as const;

function FlyTo({ block }: { block?: Block }) {
  const map = useMap();
  useEffect(() => {
    if (block) map.flyTo([block.lat, block.lng], Math.max(map.getZoom(), 8), { duration: 0.8 });
  }, [block, map]);
  return null;
}

type Basemap = "street" | "satellite";
const BASEMAP_KEY = "mm-basemap";

/** Remember the chosen base map across maps and visits (this browser only). */
function useBasemap(): [Basemap, (b: Basemap) => void] {
  const [basemap, setState] = useState<Basemap>(() => {
    try {
      return localStorage.getItem(BASEMAP_KEY) === "satellite" ? "satellite" : "street";
    } catch {
      return "street";
    }
  });
  const set = (b: Basemap) => {
    setState(b);
    try {
      localStorage.setItem(BASEMAP_KEY, b);
    } catch {
      /* storage unavailable: keep the choice for this map only */
    }
  };
  return [basemap, set];
}

/** Map / Satellite switch, top-right over the map. */
function BasemapToggle({ value, onChange }: { value: Basemap; onChange: (b: Basemap) => void }) {
  const { t } = useT();
  const options: { value: Basemap; label: string; icon: typeof MapIcon }[] = [
    { value: "street", label: t("map.street"), icon: MapIcon },
    { value: "satellite", label: t("map.satellite"), icon: Satellite },
  ];
  return (
    <div
      role="radiogroup"
      aria-label={t("map.baseLabel")}
      className="absolute right-2.5 top-2.5 z-[500] flex gap-0.5 rounded-control border border-line bg-white/95 p-0.5 shadow-raise backdrop-blur"
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`flex min-h-8 items-center gap-1.5 rounded-[6px] px-2.5 text-[12px] font-semibold transition ${
              on ? "bg-monsoon-800 text-white shadow-soft" : "text-body hover:bg-slate-100"
            }`}
          >
            <o.icon className="h-3.5 w-3.5" aria-hidden />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export default function BlockMapLeaflet({
  blocks,
  forecasts,
  layer,
  week,
  selectedId,
  onSelect,
  focusId,
  className = "h-[420px]",
  labelFor = (b) => b.name,
  layerLabel: layerLabelProp,
  emphasizeSelected = false,
  markerStyle = "cell",
  fullscreenButton = false,
}: BlockMapProps) {
  const { t } = useT();
  const layerLabel = layerLabelProp ?? layer;
  const dots = markerStyle === "dot";
  const focusBlock = blocks.find((b) => b.id === focusId);
  const selectedBlock = emphasizeSelected ? blocks.find((b) => b.id === selectedId) : undefined;
  const dimOthers = !!selectedBlock && !!forecasts[selectedBlock.id];
  // Dot mode always marks (and gently pans to) the selection; dimming stays opt-in.
  const selectedDot = dots ? blocks.find((b) => b.id === selectedId && forecasts[b.id]) : undefined;
  const [hoverId, setHoverId] = useState<string | null>(null);
  const onHover = useCallback((id: string | null) => setHoverId(id), []);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [basemap, setBasemap] = useBasemap();
  const satellite = basemap === "satellite";
  // Let the imagery show through the risk cells a little more on satellite.
  const baseFill = satellite ? 0.58 : 0.72;
  const dotLayerLabel = layerLabelProp ?? t(`layer.${layer}`);
  return (
    <div ref={wrapRef} className="mm-map-wrap relative w-full">
    <MapContainer
      ref={mapRef}
      bounds={MAHARASHTRA_BOUNDS}
      boundsOptions={{ padding: [8, 8] }}
      zoomSnap={0.25}
      minZoom={5}
      className={`w-full rounded-card border border-line ${className}`}
      scrollWheelZoom={false}
      attributionControl
      aria-label="Block risk map"
    >
      {/* Keyless public tiles. If tiles fail (offline), block cells still render. */}
      {satellite ? (
        <>
          <TileLayer
            key="sat"
            attribution="Imagery &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={17}
          />
          {/* Place names and boundaries on top of the imagery */}
          <TileLayer
            key="sat-labels"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
            maxZoom={17}
            opacity={0.85}
          />
        </>
      ) : (
        <TileLayer
          key="osm"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={12}
          className="mm-tiles"
        />
      )}
      {dots &&
        blocks.map((b) => {
          const f = forecasts[b.id];
          if (!f) return null;
          const value = f.weeks[week - 1][FIELD[layer]];
          const name = labelFor(b);
          const detail = `${b.district} · ${dotLayerLabel} ${value}%`;
          return (
            <DotMarker
              key={b.id}
              block={b}
              color={DOT_HEX[riskForLayer(layer, value)]}
              selected={b.id === selectedId}
              dimmed={dimOthers && b.id !== selectedId}
              falseOnset={f.falseOnsetRisk && layer === "break"}
              hovered={hoverId === b.id}
              name={name}
              detail={detail}
              ariaLabel={`${name}, ${detail}${f.falseOnsetRisk ? " · ⚠ False-onset risk" : ""}`}
              onHover={onHover}
              onSelect={onSelect}
            />
          );
        })}
      {dots && selectedDot && (
        <Marker key={`ring-${selectedDot.id}`} position={[selectedDot.lat, selectedDot.lng]} icon={DOT_RING_ICON} interactive={false} keyboard={false}>
          <Tooltip permanent direction="top" offset={[0, -12]} className="mm-tooltip mm-selected-label mm-selected-pop">
            <strong>{labelFor(selectedDot)}</strong> · {selectedDot.district}
          </Tooltip>
        </Marker>
      )}
      {!dots && blocks.map((b) => {
        const f = forecasts[b.id];
        if (!f) return null;
        const w = f.weeks[week - 1];
        const value = w[FIELD[layer]];
        const level = riskForLayer(layer, value);
        const selected = b.id === selectedId;
        const positions: LatLngExpression[] = b.geometry.map(([lng, lat]) => [lat, lng]);
        return (
          <Polygon
            key={b.id}
            positions={positions}
            pathOptions={{
              color: selected ? "#0b1d33" : f.falseOnsetRisk && layer === "break" ? "#7f1d1d" : "#ffffff",
              weight: selected ? 3.5 : 1.5,
              dashArray: f.falseOnsetRisk && !selected && layer === "break" ? "4 3" : undefined,
              fillColor: RISK_HEX[level],
              fillOpacity: selected ? 0.9 : dimOthers ? 0.32 : baseFill,
              opacity: dimOthers && !selected ? 0.55 : 1,
            }}
            eventHandlers={{ click: () => onSelect?.(b.id) }}
          >
            <Tooltip sticky className="mm-tooltip">
              <strong>{labelFor(b)}</strong> · {b.district}
              <br />
              {layerLabel}: <strong>{value}%</strong> (W{week})
              {f.falseOnsetRisk && (
                <>
                  <br />⚠ False-onset risk
                </>
              )}
            </Tooltip>
          </Polygon>
        );
      })}
      {/* Selection overlay, drawn last so it sits above every other cell. */}
      {!dots && dimOthers && selectedBlock && (() => {
        const f = forecasts[selectedBlock.id];
        const value = f.weeks[week - 1][FIELD[layer]];
        const positions: LatLngExpression[] = selectedBlock.geometry.map(([lng, lat]) => [lat, lng]);
        return (
          <Fragment key={`sel-${selectedBlock.id}`}>
            {/* White halo */}
            <Polygon positions={positions} interactive={false} pathOptions={{ color: "#ffffff", weight: 9, opacity: 0.95, fill: false }} />
            {/* Crisp outline + full-strength fill */}
            <Polygon
              positions={positions}
              interactive={false}
              pathOptions={{ color: "#0b1d33", weight: 3, fillColor: RISK_HEX[riskForLayer(layer, value)], fillOpacity: 0.95, className: "mm-selected-cell" }}
            />
            <Marker position={[selectedBlock.lat, selectedBlock.lng]} icon={PULSE_ICON} interactive={false} keyboard={false}>
              <Tooltip permanent direction="top" offset={[0, -10]} className="mm-tooltip mm-selected-label">
                <strong>{labelFor(selectedBlock)}</strong> · {selectedBlock.district}
              </Tooltip>
            </Marker>
          </Fragment>
        );
      })()}
      <PanIntoView block={dots ? selectedDot : dimOthers ? selectedBlock : undefined} />
      <FlyTo block={focusBlock} />
    </MapContainer>
    <BasemapToggle value={basemap} onChange={setBasemap} />
    {fullscreenButton && <FullscreenButton wrapRef={wrapRef} mapRef={mapRef} />}
    </div>
  );
}
