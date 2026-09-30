"use client";

/**
 * Small motion pieces for the landing page sections below the hero:
 * a hover-tilt card, a looping "active index" hook and one tiny animated
 * visual per KPI card. Everything calms down under prefers-reduced-motion.
 */
import { useEffect, useRef, useState, type ReactNode, type PointerEvent } from "react";
import { AnimatePresence, motion, useInView, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Cycle 0..n-1 every `ms` while `run` is true. */
export function useLoopIndex(n: number, ms: number, run: boolean): [number, (i: number) => void] {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!run) return;
    const id = window.setInterval(() => setI((v) => (v + 1) % n), ms);
    return () => window.clearInterval(id);
  }, [n, ms, run]);
  return [i, setI];
}

/** Card that tilts a few degrees towards the pointer (mouse only). */
export function TiltCard({ children, className = "", max = 6 }: { children: ReactNode; className?: string; max?: number }) {
  const reduce = useReducedMotion();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, { stiffness: 180, damping: 18 });
  const rotateY = useSpring(ry, { stiffness: 180, damping: 18 });

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * max * 2);
    rx.set(-py * max * 2);
  };
  const reset = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      className={className}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      onPointerMove={onMove}
      onPointerLeave={reset}
    >
      {children}
    </motion.div>
  );
}

/* ---------------------------------------------------------------- KPI visuals */

/** One dot per demo block, popping in, with a few gently twinkling. */
export function BlocksViz({ count }: { count: number }) {
  const reduce = useReducedMotion();
  // Illustrative risk mix, deterministic so SSR and client agree.
  const tone = (i: number) => (i % 13 === 5 ? "bg-red-500" : i % 9 === 2 ? "bg-orange-400" : i % 5 === 3 ? "bg-yellow-400" : "bg-leaf-500");
  return (
    <div className="grid w-fit grid-cols-10 gap-1" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <motion.span
          key={i}
          className={`h-2 w-2 rounded-full ${tone(i)} ${i % 7 === 0 ? "mm-twinkle" : ""}`}
          style={{ animationDelay: `${(i % 5) * 0.7}s` }}
          initial={reduce ? false : { scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25 + i * 0.018, type: "spring", stiffness: 420, damping: 18 }}
        />
      ))}
    </div>
  );
}

/** Four week bars (confidence falls with lead time) with a moving highlight. */
export function WeeksViz() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-20px" });
  const [active] = useLoopIndex(4, 1100, inView && !reduce);
  const heights = [92, 78, 64, 52];
  return (
    <div ref={ref} className="flex h-10 items-end gap-1.5" aria-hidden>
      {heights.map((h, i) => (
        <div key={i} className="flex h-full flex-col items-center justify-end gap-0.5">
          <motion.span
            className={`w-5 origin-bottom rounded-t-[4px] transition-colors duration-500 ${active === i ? "bg-monsoon-600" : "bg-monsoon-200"}`}
            style={{ height: `${h * 0.3}px` }}
            initial={reduce ? false : { scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 + i * 0.12, duration: 0.6, ease: EASE }}
          />
          <span className={`text-[9px] font-bold leading-none transition-colors duration-500 ${active === i ? "text-monsoon-700" : "text-slate-400"}`}>W{i + 1}</span>
        </div>
      ))}
    </div>
  );
}

const GREETINGS = [
  { text: "Hello", lang: "en" },
  { text: "नमस्ते", lang: "hi" },
  { text: "नमस्कार", lang: "mr" },
];

/** Greeting that rolls through the three supported languages. */
export function LanguagesViz() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const [i] = useLoopIndex(GREETINGS.length, 1800, inView && !reduce);
  const g = GREETINGS[i];
  return (
    <div ref={ref} className="flex items-center gap-2" aria-hidden>
      <span className="relative inline-flex h-7 min-w-[5.5rem] items-center overflow-hidden rounded-full border border-sun-200 bg-sun-50 px-3 text-[13px] font-bold text-sun-600">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={g.text}
            lang={g.lang}
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            {g.text}
          </motion.span>
        </AnimatePresence>
      </span>
      <span className="flex gap-1">
        {GREETINGS.map((x, k) => (
          <span key={x.lang} className={`h-1.5 rounded-full transition-all duration-500 ${k === i ? "w-4 bg-sun-500" : "w-1.5 bg-sun-200"}`} />
        ))}
      </span>
    </div>
  );
}

/** Rising savings line that draws itself, ending in a pulsing point. */
export function SavingsViz() {
  const reduce = useReducedMotion();
  const d = "M2 34 C 18 32, 26 28, 38 26 S 58 18, 70 16 S 92 8, 108 5";
  return (
    <svg viewBox="0 0 112 40" className="h-10 w-28 overflow-visible" aria-hidden>
      <defs>
        <linearGradient id="mm-sv-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fb923c" stopOpacity="0.35" />
          <stop offset="1" stopColor="#fb923c" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={`${d} L108 40 L2 40 Z`}
        fill="url(#mm-sv-fill)"
        initial={reduce ? false : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.9, duration: 0.6 }}
      />
      <motion.path
        d={d}
        fill="none"
        stroke="#f97316"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={reduce ? false : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3, duration: 1.2, ease: "easeInOut" }}
      />
      <circle cx="108" cy="5" r="7" fill="#f97316" className="mm-sv-ping" />
      <motion.circle
        cx="108"
        cy="5"
        r="3.5"
        fill="#fff"
        stroke="#f97316"
        strokeWidth="2"
        initial={reduce ? false : { scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1.4, type: "spring", stiffness: 400, damping: 15 }}
      />
    </svg>
  );
}
