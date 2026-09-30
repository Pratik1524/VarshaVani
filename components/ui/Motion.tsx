"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { animate, motion, useInView, useReducedMotion } from "framer-motion";

/** Fade + rise into place the first time the element scrolls into view. */
export function Reveal({
  children,
  delay = 0,
  y = 16,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "li";
}) {
  const reduce = useReducedMotion();
  const Tag = as === "section" ? motion.section : as === "li" ? motion.li : motion.div;
  return (
    <Tag
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Tag>
  );
}

/** Animated number that counts up when it first becomes visible (and on change). */
export function CountUp({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1.1,
  signed = false,
  className = "",
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  /** Show a leading "+" for positive values. */
  signed?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(from.current, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setShown(v),
    });
    from.current = value;
    return () => controls.stop();
  }, [inView, value, duration, reduce]);

  const text = (reduce ? value : shown).toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return (
    <span ref={ref} className={`tabular-nums ${className}`} aria-label={`${prefix}${signed && value > 0 ? "+" : ""}${value.toFixed(decimals)}${suffix}`}>
      <span aria-hidden>
        {prefix}
        {signed && value > 0 ? "+" : ""}
        {text}
        {suffix}
      </span>
    </span>
  );
}

/**
 * Horizontal influence meter, -1 (hurts monsoon rain) .. +1 (helps).
 * The marker slides in from the centre.
 */
export function InfluenceMeter({ value, label }: { value: number; label: string }) {
  const v = Math.max(-1, Math.min(1, value));
  const pct = 50 + v * 50;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted">
        <span>Drier</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] normal-case tracking-normal ${
            v <= -0.25 ? "bg-red-50 text-red-700" : v >= 0.25 ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-800"
          }`}
        >
          Effect on rain: {label.toLowerCase()}
        </span>
        <span>Wetter</span>
      </div>
      <div className="relative h-2 rounded-full bg-gradient-to-r from-red-400 via-yellow-300 to-green-500">
        <span className="absolute left-1/2 top-1/2 h-3 w-px -translate-y-1/2 bg-white/90" aria-hidden />
        <motion.span
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-ink shadow-raise"
          initial={{ left: "50%" }}
          whileInView={{ left: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 90, damping: 14, delay: 0.25 }}
          aria-hidden
        />
      </div>
    </div>
  );
}
