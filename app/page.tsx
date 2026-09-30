"use client";

import Link from "next/link";
import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  BookOpen,
  CalendarRange,
  FlaskConical,
  Globe,
  History,
  IndianRupee,
  Languages,
  Map as MapIcon,
  MessageCircle,
  Satellite,
  Cpu,
  Megaphone,
} from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { FalseOnsetStory } from "@/components/landing/FalseOnsetStory";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { BlocksViz, LanguagesViz, SavingsViz, TiltCard, WeeksViz, useLoopIndex } from "@/components/landing/LandingMotion";
import { CountUp } from "@/components/ui/Motion";
import { useT } from "@/hooks/useT";
import { BLOCKS } from "@/data/blocks";
import { REPLAY_ASSUMPTIONS } from "@/data/history";
import type { TKey } from "@/lib/i18n";

const HOW: { title: TKey; desc: TKey; icon: typeof Globe }[] = [
  { title: "landing.how1", desc: "landing.how1d", icon: Satellite },
  { title: "landing.how2", desc: "landing.how2d", icon: Cpu },
  { title: "landing.how3", desc: "landing.how3d", icon: MapIcon },
  { title: "landing.how4", desc: "landing.how4d", icon: Megaphone },
];

const EXPLORE: { href: string; key: TKey; icon: typeof Globe }[] = [
  { href: "/map", key: "nav.map", icon: MapIcon },
  { href: "/drivers", key: "nav.drivers", icon: Globe },
  { href: "/simulator", key: "nav.simulator", icon: FlaskConical },
  { href: "/replay", key: "nav.replay", icon: History },
  { href: "/gateway", key: "nav.gateway", icon: MessageCircle },
  { href: "/methodology", key: "nav.methodology", icon: BookOpen },
];

const EASE = [0.22, 1, 0.36, 1] as const;

/** Subtle, shared card hover: tiny lift, softer shadow, tinted border. */
const CARD_HOVER = "transition duration-300 ease-out hover:-translate-y-0.5 hover:border-leaf-200 hover:shadow-raise";

/** Section title with an accent bar that grows in when scrolled into view. */
function SectionTitle({ id, children, aside }: { id: string; children: ReactNode; aside?: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
      <div className="flex items-center gap-3">
        <motion.span
          className="h-8 w-1 origin-bottom rounded-full bg-gradient-to-b from-leaf-500 to-monsoon-500"
          initial={reduce ? false : { scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: EASE }}
          aria-hidden
        />
        <motion.h2
          id={id}
          initial={reduce ? false : { opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.05, ease: EASE }}
          className="scroll-mt-24 text-[1.55rem] font-bold tracking-tight text-monsoon-950 sm:text-[1.75rem]"
        >
          {children}
        </motion.h2>
      </div>
      {aside}
    </div>
  );
}

/** Staggered reveal for grid items. */
function Rise({ i, children, className = "", as = "li" }: { i: number; children: ReactNode; className?: string; as?: "li" | "div" }) {
  const reduce = useReducedMotion();
  const Tag = as === "li" ? motion.li : motion.div;
  return (
    <Tag
      className={className}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: i * 0.08, ease: EASE }}
    >
      {children}
    </Tag>
  );
}

export default function LandingPage() {
  const { t } = useT();
  const reduce = useReducedMotion();

  const stats: { node: ReactNode; label: string; icon: typeof Globe; tone: string; viz: ReactNode }[] = [
    { node: <CountUp value={BLOCKS.length} />, label: t("landing.stat1"), icon: MapIcon, tone: "from-leaf-50 text-leaf-700", viz: <BlocksViz count={BLOCKS.length} /> },
    {
      node: (
        <>
          1–<CountUp value={4} duration={0.9} />
        </>
      ),
      label: t("landing.stat2"),
      icon: CalendarRange,
      tone: "from-monsoon-50 text-monsoon-700",
      viz: <WeeksViz />,
    },
    { node: <CountUp value={3} duration={0.8} />, label: t("landing.stat3"), icon: Languages, tone: "from-sun-50 text-sun-600", viz: <LanguagesViz /> },
    {
      node: <CountUp value={REPLAY_ASSUMPTIONS.resowingCostPerHa} prefix="₹" duration={1.4} />,
      label: t("landing.stat4"),
      icon: IndianRupee,
      tone: "from-orange-50 text-orange-700",
      viz: <SavingsViz />,
    },
  ];

  // How-it-works: highlight one step at a time while the section is visible.
  const howRef = useRef<HTMLDivElement>(null);
  const howInView = useInView(howRef, { margin: "-80px" });
  const [howHover, setHowHover] = useState(false);
  const [activeStep, setActiveStep] = useLoopIndex(HOW.length, 2600, howInView && !howHover && !reduce);

  return (
    <PageShell hero={<LandingHero />} header={<LandingHeader />} footer={<LandingFooter />}>
      {/* Story */}
      <section className="relative pt-2" aria-labelledby="story">
        <SectionTitle id="story">{t("landing.storyTitle")}</SectionTitle>
        <FalseOnsetStory />
      </section>

      {/* Stats */}
      <section className="relative isolate pt-14" aria-labelledby="stats">
        {/* Slowly drifting colour washes behind the KPI cards */}
        <span className="mm-drift pointer-events-none absolute left-0 top-20 -z-10 h-56 w-56 rounded-full bg-leaf-200/40 blur-3xl" aria-hidden />
        <span className="mm-drift-slow pointer-events-none absolute right-0 top-10 -z-10 h-64 w-64 rounded-full bg-monsoon-200/40 blur-3xl" aria-hidden />
        <SectionTitle id="stats" aside={<p className="text-[13px] text-slate-500">{t("landing.statsNote")}</p>}>
          {t("landing.statsTitle")}
        </SectionTitle>
        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Rise key={s.label} i={i}>
              <TiltCard className="h-full">
                <div
                  className={`mm-glow-border mm-sheen group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:p-5 ${CARD_HOVER}`}
                  style={{ "--mm-sheen-delay": `${i * 0.9}s` } as CSSProperties}
                >
                  <span className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b to-transparent opacity-70 ${s.tone.split(" ")[0]}`} aria-hidden />
                  <div className="relative flex items-start justify-between gap-2">
                    <span
                      className={`mm-l-bob grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white shadow-soft ring-1 ring-slate-100 transition-transform duration-300 group-hover:scale-110 ${s.tone.split(" ")[1]}`}
                      style={{ animationDelay: `${-i * 1.3}s` }}
                    >
                      <s.icon className="h-5 w-5" aria-hidden />
                    </span>
                  </div>
                  <p className="relative mt-4 text-[1.75rem] font-bold leading-none tabular-nums text-monsoon-950 sm:text-[2rem]">{s.node}</p>
                  <p className="relative mt-2 text-[13px] leading-snug text-slate-600">{s.label}</p>
                  <div className="relative mt-auto pt-4">{s.viz}</div>
                </div>
              </TiltCard>
            </Rise>
          ))}
        </ul>
      </section>

      {/* How it works */}
      <section className="pt-14" aria-labelledby="how">
        <SectionTitle id="how">{t("landing.howTitle")}</SectionTitle>
        <div ref={howRef} className="relative" onPointerEnter={() => setHowHover(true)} onPointerLeave={() => setHowHover(false)}>
          {/* Connector that draws across the four steps (desktop) */}
          <div className="absolute left-[12.5%] right-[12.5%] top-[2.6rem] hidden h-0.5 rounded-full bg-slate-200 lg:block" aria-hidden>
            <motion.div
              className="h-full origin-left rounded-full bg-gradient-to-r from-leaf-400 via-monsoon-400 to-leaf-500"
              initial={reduce ? false : { scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, delay: 0.2, ease: "easeInOut" }}
            />
          </div>
          <ol className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HOW.map((h, i) => {
              const on = i === activeStep;
              return (
                <Rise key={h.title} i={i}>
                  <div
                    onPointerEnter={() => setActiveStep(i)}
                    className={`group relative h-full overflow-hidden rounded-2xl border bg-white p-5 transition duration-500 ease-out ${
                      on ? "-translate-y-1 border-leaf-200 shadow-raise" : "border-slate-200 shadow-soft"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-4 ring-white transition duration-500 group-hover:-rotate-6 ${
                          on ? "bg-gradient-to-br from-leaf-500 to-monsoon-500 text-white shadow-[0_8px_18px_-8px_rgb(31_85_146/0.7)]" : "bg-gradient-to-br from-leaf-50 to-monsoon-50 text-leaf-700"
                        }`}
                      >
                        {on && !reduce && <span className="absolute inset-0 animate-ping rounded-xl bg-leaf-400/30 [animation-duration:1.8s]" aria-hidden />}
                        <h.icon className="relative h-5 w-5" aria-hidden />
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold tracking-[0.14em] transition-colors duration-500 ${
                          on ? "bg-leaf-50 text-leaf-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h3 className="mt-4 text-[15px] font-bold text-monsoon-950">{t(h.title)}</h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">{t(h.desc)}</p>
                    {/* Progress for the highlighted step */}
                    <span className="absolute inset-x-0 bottom-0 h-1 bg-slate-100" aria-hidden>
                      {on && (
                        <motion.span
                          key={`p-${activeStep}`}
                          className="block h-full origin-left bg-gradient-to-r from-leaf-400 to-monsoon-400"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: howHover || reduce ? 0.4 : 2.6, ease: "linear" }}
                        />
                      )}
                    </span>
                  </div>
                </Rise>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Explore */}
      <section className="pb-6 pt-14" aria-labelledby="explore">
        <SectionTitle id="explore">{t("landing.explore")}</SectionTitle>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {EXPLORE.map((e, i) => (
            <Rise key={e.href} i={i}>
              <Link
                href={e.href}
                className={`mm-glow-border group flex h-full flex-col items-start gap-2.5 rounded-2xl border border-slate-200 bg-white p-4 text-[13px] font-semibold leading-snug text-monsoon-950 shadow-soft ${CARD_HOVER} hover:bg-leaf-50/30`}
              >
                <span className="flex w-full items-center justify-between">
                  <span
                    className="mm-l-bob grid h-9 w-9 place-items-center rounded-xl bg-leaf-50 text-leaf-700 transition duration-300 group-hover:rotate-[-8deg] group-hover:bg-leaf-600 group-hover:text-white"
                    style={{ animationDelay: `${-i * 0.9}s` }}
                  >
                    <e.icon className="h-4.5 w-4.5" aria-hidden />
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-slate-300 transition duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-leaf-600" aria-hidden />
                </span>
                {t(e.key)}
              </Link>
            </Rise>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}
