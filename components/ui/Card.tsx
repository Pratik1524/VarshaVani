import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { H1, H2, H3, MUTED, SURFACE } from "@/lib/ui";

/**
 * The one card surface used across the app: white, hairline border, very soft
 * shadow, medium radius. Pass `pad` for the standard internal padding instead
 * of hand-writing p-4 everywhere.
 */
export function Card({
  children,
  className = "",
  pad = false,
  as: Tag = "section",
  labelledBy,
  label,
}: {
  children: ReactNode;
  className?: string;
  /** Apply the standard card padding (16px, 20px from sm up). */
  pad?: boolean;
  as?: "section" | "div" | "article" | "li";
  /** id of the heading that names this region. */
  labelledBy?: string;
  /** Accessible name when there is no visible heading. */
  label?: string;
}) {
  return (
    <Tag className={`${SURFACE} ${pad ? "p-4 sm:p-5" : ""} ${className}`} aria-labelledby={labelledBy} aria-label={label}>
      {children}
    </Tag>
  );
}

/** Header inside a card: optional icon tile, title, subtitle and action. */
export function CardHeader({
  title,
  subtitle,
  icon: Icon,
  action,
  as: H = "h2",
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
      <div className="flex min-w-0 items-start gap-2.5">
        {Icon && (
          <span className="mt-px grid h-8 w-8 shrink-0 place-items-center rounded-control bg-leaf-50 text-leaf-700">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
        )}
        <div className="min-w-0">
          <H className={H3}>{title}</H>
          {subtitle && <p className={`mt-0.5 ${MUTED}`}>{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

/**
 * Top-of-page heading. `farmer` bumps the type and drops the icon tile so
 * farmer screens stay large and uncluttered.
 */
export function PageTitle({
  title,
  subtitle,
  icon: Icon,
  action,
  meta,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
  /** Small line under the subtitle, e.g. "Issued 12 Jun". */
  meta?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-leaf-50 text-leaf-700 ring-1 ring-leaf-100">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
        )}
        <div className="min-w-0">
          <h1 className={H1}>{title}</h1>
          {subtitle && <p className="mt-1 text-[13.5px] leading-relaxed text-muted sm:text-sm">{subtitle}</p>}
          {meta && <p className="mt-1 text-xs text-muted">{meta}</p>}
        </div>
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}

/**
 * Heading for a section of a page (a group of cards, a table, a chart row).
 * Renders an h2 with an optional description and right-aligned controls.
 */
export function SectionHeading({
  id,
  title,
  description,
  action,
  className = "",
}: {
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 ${className}`}>
      <div className="min-w-0">
        <h2 id={id} className={H2}>
          {title}
        </h2>
        {description && <p className={`mt-1 ${MUTED}`}>{description}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}

/**
 * Small "illustrative / simulated" qualifier used next to page titles so the
 * prototype never overstates its data.
 */
export function NoteChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-sun-200 bg-sun-50 px-2.5 py-1 text-[11.5px] font-semibold text-sun-600">
      <span className="h-1.5 w-1.5 rounded-full bg-sun-400" aria-hidden />
      {children}
    </span>
  );
}
