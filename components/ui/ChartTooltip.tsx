"use client";

/**
 * Card-style Recharts tooltip: title, one row per series with a colour swatch,
 * and an optional footer. Pass as `content={<ChartTooltip ... />}`; Recharts
 * injects `active`, `payload` and `label`.
 */
interface Item {
  name?: string | number;
  value?: unknown;
  color?: string;
  fill?: string;
  stroke?: string;
  dataKey?: unknown;
}

export function ChartTooltip({
  active,
  payload,
  label,
  unit = "",
  labelFormatter,
  valueFormatter,
  footer,
  colorFor,
}: {
  active?: boolean;
  payload?: readonly Item[];
  label?: unknown;
  unit?: string;
  labelFormatter?: (label: string) => string;
  valueFormatter?: (value: number, name: string) => string;
  footer?: (payload: readonly Item[]) => string | null;
  /** Swatch colour per series name (for gradient / per-cell fills). */
  colorFor?: (name: string) => string | undefined;
}) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((p) => p.value !== null && p.value !== undefined);
  if (!rows.length) return null;
  const title = labelFormatter ? labelFormatter(String(label)) : String(label ?? "");
  const note = footer?.(rows);
  return (
    <div className="min-w-40 rounded-control border border-line bg-white/95 px-3 py-2 text-[12px] shadow-lift backdrop-blur">
      {title && <p className="mb-1 font-bold text-ink">{title}</p>}
      <ul className="space-y-0.5">
        {rows.map((p, i) => {
          const custom = colorFor?.(String(p.name ?? ""));
          const swatch = custom ? custom : p.stroke && !String(p.stroke).startsWith("url") ? p.stroke : p.color && !String(p.color).startsWith("url") ? p.color : "#94a3b8";
          const n = Number(p.value);
          return (
            <li key={i} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-body">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: swatch }} aria-hidden />
                {String(p.name ?? "")}
              </span>
              <span className="font-semibold tabular-nums text-ink">
                {valueFormatter ? valueFormatter(n, String(p.name ?? "")) : `${Number.isFinite(n) ? n : String(p.value)}${unit}`}
              </span>
            </li>
          );
        })}
      </ul>
      {note && <p className="mt-1.5 border-t border-line pt-1.5 text-[11px] text-muted">{note}</p>}
    </div>
  );
}
