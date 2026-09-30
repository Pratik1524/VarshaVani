"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BellRing, Check, CloudRain, Hourglass, Skull, Sprout, Sun, Wheat, X, type LucideIcon } from "lucide-react";
import { useT } from "@/hooks/useT";
import type { TKey } from "@/lib/i18n";

interface Step {
  key: TKey;
  icon: LucideIcon;
  tile: string;
}

const WITHOUT: Step[] = [
  { key: "landing.step.rain", icon: CloudRain, tile: "bg-monsoon-100 text-monsoon-700" },
  { key: "landing.step.sow", icon: Sprout, tile: "bg-leaf-100 text-leaf-700" },
  { key: "landing.step.dry", icon: Sun, tile: "bg-orange-100 text-orange-700" },
  { key: "landing.step.loss", icon: Skull, tile: "bg-red-100 text-red-700" },
];

const WITH: Step[] = [
  { key: "landing.step.rain", icon: CloudRain, tile: "bg-monsoon-100 text-monsoon-700" },
  { key: "landing.step.warn", icon: BellRing, tile: "bg-yellow-100 text-yellow-800" },
  { key: "landing.step.wait", icon: Hourglass, tile: "bg-sun-100 text-sun-600" },
  { key: "landing.step.safe", icon: Sprout, tile: "bg-leaf-100 text-leaf-700" },
  { key: "landing.step.crop", icon: Wheat, tile: "bg-green-100 text-green-700" },
];

const EASE = [0.22, 1, 0.36, 1] as const;
const STEP_GAP = 0.28;

/** One storyline: steps appear in order along a track that fills in, then a pulse keeps travelling along it. */
function Lane({ title, steps, bad, delay }: { title: string; steps: Step[]; bad: boolean; delay: number }) {
  const { t } = useT();
  const reduce = useReducedMotion();
  const total = delay + steps.length * STEP_GAP;
  const accent = bad ? "#f97316" : "#438c35";

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: delay * 0.4, ease: EASE }}
      className={`group relative overflow-hidden rounded-3xl border p-4 shadow-soft transition duration-300 hover:shadow-raise sm:p-5 ${
        bad ? "border-red-200/80 bg-gradient-to-br from-red-50 via-white to-orange-50/60" : "border-green-200/80 bg-gradient-to-br from-green-50 via-white to-leaf-50/70"
      }`}
    >
      {/* Soft corner glow */}
      <span
        className={`pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl transition-opacity duration-500 group-hover:opacity-100 ${
          bad ? "bg-orange-200/40 opacity-60" : "bg-leaf-200/50 opacity-60"
        }`}
        aria-hidden
      />

      <p className={`relative mb-4 flex items-center gap-2 text-[12.5px] font-extrabold uppercase tracking-[0.1em] ${bad ? "text-red-700" : "text-green-700"}`}>
        <span className={`grid h-6 w-6 place-items-center rounded-full text-white ${bad ? "bg-red-500" : "bg-green-600"}`}>
          {bad ? <X className="h-3.5 w-3.5" aria-hidden /> : <Check className="h-3.5 w-3.5" aria-hidden />}
        </span>
        {title}
      </p>

      <div className="relative">
        {/* Track (desktop: horizontal behind the steps; mobile: vertical on the left) */}
        <div className="absolute left-[1.35rem] top-6 bottom-6 w-0.5 rounded-full bg-slate-200 md:left-6 md:right-6 md:top-[1.35rem] md:bottom-auto md:h-0.5 md:w-auto" aria-hidden>
          <motion.div
            className="h-full w-full origin-top rounded-full md:origin-left"
            style={{ background: accent }}
            initial={reduce ? false : { scaleX: 0, scaleY: 0 }}
            whileInView={{ scaleX: 1, scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: steps.length * STEP_GAP + 0.3, delay, ease: "easeInOut" }}
          />
          {/* Travelling pulse (keeps the story moving after it has played) */}
          {!reduce && (
            <motion.span
              className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full max-md:hidden"
              style={{ background: accent, boxShadow: `0 0 0 4px ${accent}33, 0 0 14px ${accent}` }}
              initial={{ left: "0%", opacity: 0 }}
              whileInView={{ left: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
              viewport={{ once: true }}
              transition={{ duration: 3.2, delay: total + 0.4, repeat: Infinity, repeatDelay: 1.2, ease: "easeInOut" }}
              aria-hidden
            />
          )}
        </div>

        <ol className={`relative grid gap-3 md:gap-2 ${steps.length === 5 ? "md:grid-cols-5" : "md:grid-cols-4"}`}>
          {steps.map((s, i) => {
            const last = i === steps.length - 1;
            return (
              <motion.li
                key={s.key + i}
                initial={reduce ? false : { opacity: 0, y: 12, scale: 0.94 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: delay + i * STEP_GAP, duration: 0.45, ease: EASE }}
                className="flex items-center gap-3 md:flex-col md:items-center md:text-center"
              >
                <motion.span
                  className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl shadow-soft ring-4 ring-white ${s.tile}`}
                  animate={
                    reduce
                      ? undefined
                      : last && bad
                        ? { rotate: [0, -6, 6, -4, 0] }
                        : last
                          ? { scale: [1, 1.08, 1] }
                          : { y: [0, -3, 0] }
                  }
                  transition={{ duration: last ? 1.6 : 3 + i * 0.3, repeat: Infinity, repeatDelay: last ? 2.2 : 0, delay: total + i * 0.15, ease: "easeInOut" }}
                >
                  <s.icon className="h-5 w-5" aria-hidden />
                  {last && !reduce && (
                    <span className={`absolute inset-0 animate-ping rounded-2xl [animation-duration:2.6s] ${bad ? "bg-red-300/30" : "bg-green-300/40"}`} aria-hidden />
                  )}
                </motion.span>
                <span
                  className={`rounded-xl px-2.5 py-1.5 text-[13.5px] font-semibold leading-snug transition-colors md:mt-1 md:px-1 ${
                    last ? (bad ? "bg-red-100/70 text-red-800" : "bg-green-100/80 text-green-800") : "text-slate-800"
                  }`}
                >
                  {t(s.key)}
                </span>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </motion.div>
  );
}

/** Animated explainer: rain -> sow -> dry spell -> loss vs. warning -> wait -> safe sowing. */
export function FalseOnsetStory() {
  const { t } = useT();
  return (
    <div className="space-y-4">
      <Lane title={t("landing.withoutTitle")} steps={WITHOUT} bad delay={0.15} />
      <Lane title={t("landing.withTitle")} steps={WITH} bad={false} delay={0.35} />
    </div>
  );
}
