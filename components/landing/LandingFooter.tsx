"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUp, Languages, LogIn, PhoneCall, ShieldAlert, Trophy } from "lucide-react";
import { LogoMark } from "@/components/ui/Logo";
import { useT } from "@/hooks/useT";
import { HERO_PHOTO } from "./HeroPhoto";

const EASE = [0.22, 1, 0.36, 1] as const;

const LINKS = [
  { href: "/map", key: "nav.map" },
  { href: "/drivers", key: "nav.drivers" },
  { href: "/simulator", key: "nav.simulator" },
  { href: "/replay", key: "nav.replay" },
  { href: "/methodology", key: "nav.methodology" },
] as const;

function Col({ i, title, children }: { i: number; title: string; children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: EASE }}
    >
      <h2 className="text-[12px] font-bold uppercase tracking-[0.12em] text-white/55!">{title}</h2>
      <div className="mt-3 space-y-2.5 text-[13.5px]">{children}</div>
    </motion.div>
  );
}

const LINK = "group inline-flex items-center text-white/80 transition hover:text-white";

/**
 * Landing-page footer: a call-to-action band, brand + quick links, farmer
 * help line, project details, data disclaimer and the photo credit.
 * Slides up into view as the visitor reaches the bottom of the page.
 */
export function LandingFooter() {
  const { t } = useT();
  const reduce = useReducedMotion();
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-10 overflow-hidden bg-monsoon-950 text-white" aria-labelledby="footer-title">
      {/* Soft wave edge + drifting glow so the footer feels alive */}
      <svg className="absolute inset-x-0 top-0 h-6 w-full text-canvas" viewBox="0 0 1440 24" preserveAspectRatio="none" aria-hidden>
        <path d="M0 0h1440v6c-120 10-240 16-360 12S840 4 720 6 480 20 360 20 120 12 0 6z" fill="currentColor" />
      </svg>
      <span className="mm-drift pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-leaf-500/20 blur-3xl" aria-hidden />
      <span className="mm-drift-slow pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-monsoon-400/20 blur-3xl" aria-hidden />
      <div className="mm-footer-rain pointer-events-none absolute inset-0 opacity-40" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 pb-6 pt-14 sm:px-6">
        {/* CTA band */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mm-glow-border mm-glow-on flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm sm:flex-row sm:items-center sm:p-6"
        >
          <div>
            <p id="footer-title" className="text-[1.25rem] font-bold tracking-tight text-white sm:text-[1.4rem]">
              {t("landing.footCtaTitle")}
            </p>
            <p className="mt-1 text-[13.5px] text-white/70">{t("landing.footCtaSub")}</p>
          </div>
          <Link
            href="/login"
            className="group inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-leaf-500 px-4 text-[14px] font-semibold text-white shadow-[0_10px_24px_-10px_rgb(67_140_53/0.8)] transition hover:-translate-y-px hover:bg-leaf-600"
          >
            <LogIn className="h-4 w-4" aria-hidden />
            {t("landing.ctaAuth")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </motion.div>

        <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.1fr_1.2fr]">
          {/* Brand */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <Link href="/" className="inline-flex items-center gap-2 rounded-xl" aria-label={`${t("app.name")} home`}>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white shadow-soft">
                <LogoMark className="h-7 w-7" />
              </span>
              <span className="text-[18px] font-bold tracking-tight">{t("app.name")}</span>
            </Link>
            <p className="mt-3 text-[15px] font-semibold text-leaf-300">
              {t("landing.brandLine1")} {t("landing.brandLine2")}
            </p>
            <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-white/65">{t("landing.footTagline")}</p>
          </motion.div>

          <Col i={1} title={t("landing.explore")}>
            <ul className="space-y-2.5">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={LINK}>
                    <span className="h-px w-0 bg-leaf-300 transition-all duration-300 group-hover:mr-1.5 group-hover:w-3" aria-hidden />
                    {t(l.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </Col>

          <Col i={2} title={t("landing.footFarmers")}>
            <a href="tel:18001801551" className="group flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] p-3 transition hover:border-leaf-400/40 hover:bg-white/[0.08]">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-leaf-500/20 text-leaf-300 transition group-hover:scale-105">
                <PhoneCall className="h-4 w-4" aria-hidden />
              </span>
              <span>
                <span className="block text-[12px] text-white/60">{t("landing.footKcc")}</span>
                <span className="block text-[15px] font-bold tabular-nums tracking-wide text-white">1800-180-1551</span>
                <span className="block text-[11.5px] text-white/50">{t("landing.footKccNote")}</span>
              </span>
            </a>
            <Link href="/gateway" className={LINK}>
              <span className="h-px w-0 bg-leaf-300 transition-all duration-300 group-hover:mr-1.5 group-hover:w-3" aria-hidden />
              {t("nav.gateway")}
            </Link>
            <p className="flex items-center gap-1.5 text-white/65">
              <Languages className="h-4 w-4 shrink-0 text-white/50" aria-hidden />
              English · <span lang="hi">हिंदी</span> · <span lang="mr">मराठी</span>
            </p>
          </Col>

          <Col i={3} title={t("landing.footProject")}>
            <p className="flex items-start gap-2 text-white/80">
              <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-sun-300" aria-hidden />
              <span>
                {t("landing.eyebrow")}
                <span className="block text-[12px] text-white/55">{t("landing.footProblem")}</span>
              </span>
            </p>
            <p className="flex items-start gap-2 rounded-xl border border-sun-300/25 bg-sun-400/10 p-3 text-[12.5px] leading-relaxed text-sun-100">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-sun-300" aria-hidden />
              {t("landing.footData")}
            </p>
          </Col>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col-reverse items-start justify-between gap-3 border-t border-white/10 pt-5 text-[12px] text-white/50 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <p>{t("landing.footRights", { year })}</p>
            <p>
              {t("landing.footPhoto")}: “2016 India Monsoon Lush Green Fields” by{" "}
              <a href={HERO_PHOTO.source} target="_blank" rel="noopener noreferrer" className="underline decoration-white/25 underline-offset-2 hover:text-white">
                {HERO_PHOTO.author}
              </a>
              ,{" "}
              <a href={HERO_PHOTO.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-white/25 underline-offset-2 hover:text-white">
                {HERO_PHOTO.license}
              </a>
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })}
            className="group inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/15 px-3.5 text-[12.5px] font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
          >
            <ArrowUp className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5" aria-hidden />
            {t("landing.footTop")}
          </button>
        </div>
      </div>
    </footer>
  );
}
