"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronDown, CloudLightning, CloudRain, LogIn, MapPin, Sun, type LucideIcon } from "lucide-react";
import type { Layer } from "@/types";
import { useT } from "@/hooks/useT";
import { useAsync } from "@/hooks/useAsync";
import { getForecast } from "@/lib/forecastService";
import { fmtRange } from "@/lib/i18n";
import { BLOCK_BY_ID, HERO_BLOCK_ID, blockName } from "@/data/blocks";
import { HeroPhoto, PhotoCredit } from "./HeroPhoto";

const SIGNALS: { layer: Layer; icon: LucideIcon; tile: string; bar: string; field: "onset" | "breakProb" | "heavyRain" }[] = [
  { layer: "onset", icon: CloudRain, tile: "from-leaf-400 to-leaf-700", bar: "from-leaf-300 to-leaf-500", field: "onset" },
  { layer: "break", icon: Sun, tile: "from-sun-300 to-sun-500", bar: "from-sun-200 to-sun-400", field: "breakProb" },
  { layer: "heavy", icon: CloudLightning, tile: "from-monsoon-300 to-monsoon-600", bar: "from-monsoon-200 to-monsoon-400", field: "heavyRain" },
];

const EASE = [0.22, 1, 0.36, 1] as const;

/** Bold the phrases that were interpolated into a translated sentence. */
function Emphasise({ text, terms }: { text: string; terms: string[] }) {
  const pattern = terms
    .filter(Boolean)
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  if (!pattern) return <>{text}</>;
  return (
    <>
      {text.split(new RegExp(`(${pattern})`, "g")).map((part, i) =>
        terms.includes(part) ? (
          <strong key={i} className="font-semibold text-white">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

/**
 * Landing hero: real monsoon paddy-field photograph, the brand promise and a
 * single Log in / Sign up call to action on the left, live signal cards
 * floating on the right. Sign-in itself lives on /login.
 */
export function LandingHero() {
  const { t, lang } = useT();
  const reduce = useReducedMotion();
  const forecast = useAsync(() => getForecast(HERO_BLOCK_ID), "hero-forecast");
  const w1 = forecast.data?.weeks[0];
  const where = blockName(BLOCK_BY_ID[HERO_BLOCK_ID], lang);

  const scale = t("landing.promiseScale");
  const crop = t("landing.promiseCrop");

  return (
    <section className="relative isolate overflow-hidden">
      <HeroPhoto />

      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-32 pt-28 sm:px-6 sm:pb-36 sm:pt-32 lg:min-h-[max(44rem,100svh)] lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-14 lg:pb-40 xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        {/* ---------- Promise + CTA ---------- */}
        <div>
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="inline-flex max-w-full items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/90 ring-1 ring-white/20 backdrop-blur-md sm:text-[11px]"
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-leaf-300 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-leaf-300" />
            </span>
            <span className="truncate">{t("landing.kicker")}</span>
          </motion.p>

          <h1 className="mt-5 font-extrabold leading-[0.98] tracking-[-0.035em] text-white! [text-shadow:0_2px_24px_rgb(0_0_0/0.25)]">
            {[t("landing.brandLine1"), t("landing.brandLine2")].map((line, i) => (
              <span key={i} className="block overflow-hidden pb-[0.08em]">
                <motion.span
                  initial={reduce ? false : { y: "105%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.8, delay: 0.1 + i * 0.12, ease: EASE }}
                  className={`block whitespace-nowrap text-[2.9rem] min-[400px]:text-[3.3rem] sm:text-[4.3rem] xl:text-[5.2rem] ${
                    i === 1 ? "bg-gradient-to-r from-leaf-200 via-[#a8e58f] to-[#8ee3b5] bg-clip-text text-transparent drop-shadow-[0_2px_14px_rgba(0,0,0,0.45)]" : ""
                  }`}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35, ease: EASE }}
            className="mt-6 max-w-lg text-[15.5px] leading-relaxed text-white/85 sm:text-[17.5px]"
          >
            <Emphasise text={t("landing.promise", { scale, crop })} terms={[scale, crop]} />
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: EASE }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link
              href="/login"
              className="group inline-flex min-h-13 items-center gap-2.5 rounded-2xl bg-gradient-to-r from-leaf-500 to-leaf-600 px-6 text-[16px] font-semibold text-white shadow-[0_14px_30px_-10px_rgb(67_140_53/0.8)] ring-1 ring-white/20 transition hover:-translate-y-0.5 hover:from-leaf-400 hover:to-leaf-600 hover:shadow-[0_18px_36px_-10px_rgb(67_140_53/0.9)]"
            >
              <LogIn className="h-5 w-5" aria-hidden />
              {t("landing.ctaAuth")}
              <ArrowRight className="h-4.5 w-4.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
            </Link>
            <a
              href="#how"
              className="inline-flex min-h-13 items-center gap-2 rounded-2xl bg-white/10 px-5 text-[15px] font-semibold text-white ring-1 ring-white/25 backdrop-blur-md transition hover:bg-white/20"
            >
              {t("landing.howTitle")}
              <ChevronDown className="h-4 w-4" aria-hidden />
            </a>
          </motion.div>
        </div>

        {/* ---------- Floating live-signal cards ---------- */}
        <div className="relative">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45, ease: EASE }}
            className="mb-3 flex items-center justify-between gap-2 text-[12px] font-semibold text-white/85"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 ring-1 ring-white/20 backdrop-blur-md">
              <MapPin className="h-3.5 w-3.5 text-leaf-200" aria-hidden />
              {where}
            </span>
            {w1 && <span className="text-white/70">{fmtRange(lang, w1.startDate, w1.endDate)}</span>}
          </motion.div>
          <ul className="grid grid-cols-3 gap-2.5 lg:grid-cols-1 lg:gap-3.5">
            {SIGNALS.map(({ layer, icon: Icon, tile, bar, field }, i) => {
              const p = w1?.[field];
              return (
                <motion.li
                  key={layer}
                  initial={reduce ? false : { opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.7, delay: 0.55 + i * 0.12, ease: EASE }}
                  className={i === 1 ? "lg:ml-10" : ""}
                >
                  {/* Outer layer bobs; inner card lifts on hover (separate transforms). */}
                  <div className="mm-l-bob" style={{ animationDelay: `${i * -1.4}s` }}>
                    <div className="rounded-2xl bg-white/12 p-2.5 text-white shadow-[0_20px_40px_-18px_rgb(0_0_0/0.55)] ring-1 ring-white/25 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/20 sm:p-3.5 lg:flex lg:items-center lg:gap-3.5 lg:p-4">
                      <div className="flex items-center justify-between gap-1 lg:contents">
                        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br shadow-soft sm:h-10 sm:w-10 lg:h-11 lg:w-11 ${tile}`}>
                          <Icon className="h-4.5 w-4.5 text-white sm:h-5 sm:w-5" aria-hidden />
                        </span>
                        <span className="text-[1.05rem] font-bold leading-none tabular-nums sm:text-[1.35rem] lg:order-last lg:text-[1.6rem]">
                          {p !== undefined ? `${p}%` : <span className="inline-block h-5 w-9 animate-pulse rounded bg-white/20" />}
                        </span>
                      </div>
                      <div className="mt-2.5 min-w-0 lg:mt-0 lg:flex-1">
                        <p className="text-[11.5px] font-semibold leading-tight sm:text-[13px] lg:text-[14px]">{t(`layer.${layer}`)}</p>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20" aria-hidden>
                          <motion.div
                            className={`h-full rounded-full bg-gradient-to-r ${bar}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${p ?? 0}%` }}
                            transition={{ duration: 1.1, delay: 0.9 + i * 0.12, ease: EASE }}
                          />
                        </div>
                        <p className="mt-1.5 text-[10px] font-medium text-white/65 sm:text-[11px]">{t("common.week", { n: 1 })}</p>
                      </div>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Scroll cue */}
      <a
        href="#story"
        aria-label={t("landing.storyTitle")}
        className="absolute bottom-20 left-1/2 hidden -translate-x-1/2 rounded-full bg-white/15 p-2 text-white ring-1 ring-white/30 backdrop-blur-md transition hover:bg-white/25 lg:block"
      >
        <ChevronDown className="mm-l-cue h-5 w-5" aria-hidden />
      </a>

      <PhotoCredit className="absolute bottom-16 right-4 sm:right-6" />

      {/* Curved hand-off into the page canvas */}
      <svg className="absolute inset-x-0 -bottom-px h-14 w-full sm:h-20" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden>
        <path d="M0 64 C 240 20 480 20 720 52 C 960 84 1200 88 1440 44 L1440 100 L0 100 Z" fill="#faf7f2" opacity="0.45" />
        <path d="M0 82 C 260 46 520 46 760 70 C 1000 94 1220 96 1440 66 L1440 100 L0 100 Z" fill="#faf7f2" />
      </svg>
    </section>
  );
}
