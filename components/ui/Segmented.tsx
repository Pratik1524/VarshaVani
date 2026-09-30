"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";

export interface SegOption<T extends string | number> {
  value: T;
  label: ReactNode;
  ariaLabel?: string;
}

/**
 * Accessible segmented control (radiogroup with roving tabindex and
 * arrow-key navigation).
 */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
  size = "md",
  className = "",
  stretch = false,
  variant = "pill",
}: {
  options: SegOption<T>[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  size?: "sm" | "md";
  className?: string;
  /** Fill the available width with equal-size segments. */
  stretch?: boolean;
  /**
   * "pill" – compact track with a sliding white thumb (default).
   * "cards" – two standalone tiles, used where the choice is a primary
   * decision (e.g. picking a role on the login form).
   */
  variant?: "pill" | "cards";
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const idx = Math.max(0, options.findIndex((o) => o.value === value));

  const onKey = (e: KeyboardEvent) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
    e.preventDefault();
    const dir = e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1;
    const next = (idx + dir + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKey}
      className={`inline-flex ${variant === "cards" ? "gap-2" : "rounded-xl bg-slate-100 p-1"} ${className}`}
    >
      {options.map((o, i) => {
        const active = o.value === value;
        const tone =
          variant === "cards"
            ? active
              ? "rounded-xl border-2 border-leaf-500 bg-leaf-50 text-leaf-900 shadow-sm"
              : "rounded-xl border-2 border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
            : active
              ? "rounded-lg bg-white text-monsoon-800 shadow-sm"
              : "rounded-lg text-slate-600 hover:text-slate-900";
        return (
          <button
            key={String(o.value)}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={o.ariaLabel}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={`flex items-center justify-center gap-1.5 font-semibold transition ${stretch ? "flex-1" : ""} ${
              variant === "cards"
                ? "min-h-11 px-2 text-center text-[12.5px] leading-tight"
                : size === "sm"
                  ? "min-h-8 px-2.5 text-xs"
                  : "min-h-10 px-3 text-sm"
            } ${tone}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
