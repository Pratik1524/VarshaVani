"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Monsoon-sky hero panel: deep blue gradient with slowly drifting cloud bands
 * and a light rain shimmer. Decorative layers are aria-hidden.
 */
export function SkyBanner({ children, tone = "monsoon", className = "" }: { children: ReactNode; tone?: "monsoon" | "dusk"; className?: string }) {
  const reduce = useReducedMotion();
  const bg =
    tone === "dusk"
      ? "bg-[radial-gradient(120%_140%_at_85%_0%,#fbb84d33_0%,transparent_45%),linear-gradient(135deg,#132f50_0%,#1a4577_45%,#6b4f33_130%)]"
      : "bg-[radial-gradient(120%_140%_at_90%_0%,#7aaddc55_0%,transparent_45%),linear-gradient(135deg,#0b1d33_0%,#173a63_50%,#1f5592_100%)]";
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden rounded-card text-white shadow-lift ${bg} ${className}`}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <svg className="mm-drift absolute -right-16 -top-10 h-56 w-[36rem] opacity-[0.18]" viewBox="0 0 600 200">
          <ellipse cx="170" cy="110" rx="150" ry="46" fill="#fff" />
          <ellipse cx="300" cy="84" rx="120" ry="56" fill="#fff" />
          <ellipse cx="430" cy="112" rx="140" ry="42" fill="#fff" />
        </svg>
        <svg className="mm-drift-slow absolute -bottom-16 left-[-4rem] h-48 w-[30rem] opacity-[0.12]" viewBox="0 0 600 200">
          <ellipse cx="200" cy="120" rx="170" ry="44" fill="#fff" />
          <ellipse cx="360" cy="96" rx="130" ry="52" fill="#fff" />
        </svg>
        {/* Rain streaks */}
        <div className="absolute inset-y-0 right-8 flex w-64 justify-between opacity-30">
          {Array.from({ length: 12 }, (_, i) => (
            <span
              key={i}
              className="block h-3 w-px animate-rain rounded-full bg-white"
              style={{ marginTop: `${(i * 37) % 90}px`, animationDelay: `${(i * 0.13) % 1.1}s` }}
            />
          ))}
        </div>
      </div>
      <div className="relative">{children}</div>
    </motion.div>
  );
}
