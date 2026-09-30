"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Info, X } from "lucide-react";

/**
 * Small click/tap popover (keyboard accessible). Rendered in a portal with
 * fixed positioning so it is never clipped by scrolling tables or cards.
 */
export function InfoPopover({
  label,
  children,
  trigger = "icon",
  closeLabel = "Close",
  width = 300,
}: {
  /** Accessible name of the trigger, and the popover heading. */
  label: string;
  children: ReactNode;
  /** "icon" = small ⓘ button, "text" = the label as a link-style button. */
  trigger?: "icon" | "text";
  closeLabel?: string;
  width?: number;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();

  const place = useCallback(() => {
    const r = btn.current?.getBoundingClientRect();
    if (!r) return;
    const w = Math.min(width, window.innerWidth - 16);
    const left = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, window.innerWidth - w - 8));
    const below = r.bottom + 8;
    const panelH = panel.current?.offsetHeight ?? 180;
    const top = below + panelH > window.innerHeight - 8 ? Math.max(8, r.top - panelH - 8) : below;
    setPos({ top, left });
  }, [width]);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!panel.current?.contains(e.target as Node) && !btn.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btn.current?.focus();
      }
    };
    // Follow the trigger while scrolling; close once it leaves the screen.
    const follow = () => {
      const r = btn.current?.getBoundingClientRect();
      if (!r || r.bottom < 0 || r.top > window.innerHeight) setOpen(false);
      else place();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", follow);
    window.addEventListener("scroll", follow, true);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", follow);
      window.removeEventListener("scroll", follow, true);
    };
  }, [open, place]);

  return (
    <>
      <button
        ref={btn}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={trigger === "icon" ? label : undefined}
        className={
          trigger === "icon"
            ? "grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted transition hover:bg-slate-100 hover:text-ink"
            : "inline-flex items-center gap-1 rounded text-[12px] font-semibold text-monsoon-700 underline decoration-dotted underline-offset-2 transition hover:text-monsoon-900"
        }
      >
        {trigger === "icon" ? <Info className="h-4 w-4" aria-hidden /> : label}
      </button>
      {open &&
        createPortal(
          <div
            ref={panel}
            id={id}
            role="dialog"
            aria-label={label}
            style={{ position: "fixed", top: pos?.top ?? -9999, left: pos?.left ?? -9999, width: Math.min(width, typeof window === "undefined" ? width : window.innerWidth - 16) }}
            className="z-[1700] animate-pop rounded-card border border-line bg-white p-3.5 text-left text-[12.5px] leading-relaxed text-body shadow-lift"
          >
            <div className="mb-1.5 flex items-start justify-between gap-2">
              <p className="text-[13px] font-bold text-ink">{label}</p>
              <button type="button" onClick={() => setOpen(false)} aria-label={closeLabel} className="-mr-1 -mt-1 grid h-6 w-6 place-items-center rounded-full text-muted hover:bg-slate-100">
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}
