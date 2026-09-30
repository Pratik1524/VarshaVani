/**
 * Shared class tokens for the VarshaVani design system.
 *
 * Anything visual that appears on more than one page belongs here (or in a
 * component under components/ui). Pages should compose these instead of
 * re-inventing borders, radii and text sizes.
 */

/* ---------- Surfaces ---------- */

/** Default card / panel surface: white, hairline border, very soft shadow. */
export const SURFACE = "rounded-card border border-line bg-white shadow-soft";

/** Same metrics, but for a quiet inset block inside a card. */
export const INSET = "rounded-control border border-line bg-slate-50/70";

/** Dashed placeholder surface for empty states and drop targets. */
export const SURFACE_DASHED = "rounded-card border border-dashed border-line-strong bg-white/60";

/* ---------- Typography ---------- */

export const H1 = "text-[1.65rem] font-bold leading-tight tracking-[-0.015em] sm:text-[2rem]";
/** Farmer screens: one size up, fewer words. */
export const H1_FARMER = "text-[1.75rem] font-bold leading-tight tracking-[-0.015em]";
export const H2 = "text-[1.15rem] font-bold leading-snug tracking-[-0.01em] sm:text-[1.3rem]";
export const H3 = "text-[0.95rem] font-bold leading-snug sm:text-base";
export const BODY = "text-sm leading-relaxed text-body";
export const MUTED = "text-[13px] leading-relaxed text-muted";
export const CAPTION = "text-xs leading-relaxed text-muted";
/** Small all-caps label. Used sparingly: table heads and card eyebrows. */
export const EYEBROW = "text-[11px] font-semibold uppercase tracking-[0.08em] text-muted";

/* ---------- Form controls ---------- */

/** Base metrics shared by input / select / textarea. */
export const CONTROL =
  "w-full rounded-control border border-line bg-white text-[14px] text-ink transition placeholder:text-slate-400 hover:border-line-strong disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

export const INPUT = `${CONTROL} min-h-10 px-3`;
/** Touch-friendly variant for farmer screens. */
export const INPUT_LG = `${CONTROL} min-h-12 px-3 text-[15px]`;
export const LABEL = "mb-1 block text-[13px] font-semibold text-ink";

/* ---------- Tables ---------- */

export const TABLE_FRAME = "overflow-x-auto rounded-card border border-line bg-white";
export const TABLE = "w-full text-[13px]";
export const THEAD = "border-b border-line bg-slate-50/80 text-left";
export const TH = "px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-muted";
export const TR = "border-t border-line/70";
export const TD = "px-3 py-2.5 align-middle text-body";

/* ---------- Layout rhythm ---------- */

/** Vertical gap between major page sections. */
export const SECTION_GAP = "space-y-6";
/** Gap between cards inside a grid. */
export const GRID_GAP = "gap-4";
