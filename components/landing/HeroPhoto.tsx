"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";

/** Licence details for the hero photo (CC BY 2.0 requires visible credit). */
export const HERO_PHOTO = {
  src: "/landing/hero-2400.jpg",
  author: "Yogendra Joshi",
  source: "https://commons.wikimedia.org/wiki/File:2016_India_Monsoon_Lush_Green_Fields.jpg",
  license: "CC BY 2.0",
  licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
};

/**
 * Full-bleed photo of Sahyadri paddy fields in the monsoon, with a slow
 * "breathing" zoom and scroll parallax. `tone` controls the readability wash.
 */
export function HeroPhoto({ tone = "hero", children, className = "" }: { tone?: "hero" | "auth"; children?: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "12%"]);

  return (
    <div ref={ref} className={`absolute inset-0 -z-10 overflow-hidden bg-monsoon-950 ${className}`} aria-hidden>
      <motion.div style={{ y }} className="absolute inset-[-4%_0_-10%_0]">
        <div className="mm-l-kenburns absolute inset-0">
          <Image src={HERO_PHOTO.src} alt="" fill priority sizes="100vw" className="object-cover object-[50%_40%]" />
        </div>
      </motion.div>
      {tone === "hero" ? (
        <>
          {/* Navy wash from the left (text side) and the top (header), fields stay vivid on the right */}
          <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(11,29,51,0.86)_0%,rgba(11,29,51,0.62)_34%,rgba(11,29,51,0.2)_62%,rgba(11,29,51,0.05)_100%)] max-lg:bg-[linear-gradient(180deg,rgba(11,29,51,0.82)_0%,rgba(11,29,51,0.6)_45%,rgba(11,29,51,0.35)_75%,rgba(11,29,51,0.55)_100%)]" />
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-monsoon-950/60 to-transparent" />
        </>
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,29,51,0.55)_0%,rgba(11,29,51,0.35)_40%,rgba(11,29,51,0.6)_100%)]" />
      )}
      {/* Drifting mist */}
      <div className="mm-drift absolute -left-1/4 top-[30%] h-40 w-[80%] rounded-full bg-white/10 blur-3xl" />
      <div className="mm-drift-slow absolute -right-1/4 top-[55%] h-32 w-[70%] rounded-full bg-white/[0.07] blur-3xl" />
      {children}
    </div>
  );
}

/** Small visible photo credit (required by the licence). */
export function PhotoCredit({ className = "" }: { className?: string }) {
  return (
    <p className={`text-[10.5px] text-white/60 ${className}`}>
      Photo:{" "}
      <a href={HERO_PHOTO.source} target="_blank" rel="noopener noreferrer" className="underline decoration-white/30 underline-offset-2 hover:text-white">
        {HERO_PHOTO.author}
      </a>{" "}
      ·{" "}
      <a href={HERO_PHOTO.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-white/30 underline-offset-2 hover:text-white">
        {HERO_PHOTO.license}
      </a>
    </p>
  );
}
