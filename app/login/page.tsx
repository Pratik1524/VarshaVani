"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { HeroAuthCard } from "@/components/landing/HeroAuth";
import { HeroPhoto, PhotoCredit } from "@/components/landing/HeroPhoto";
import { useT } from "@/hooks/useT";

/** Reads ?mode=signup, ?role=officer and ?next=/farmer/... for the auth card. */
function AuthFromParams() {
  const params = useSearchParams();
  return (
    <HeroAuthCard
      initialMode={params.get("mode") === "signup" ? "signup" : "login"}
      initialRole={params.get("role") === "officer" ? "officer" : "farmer"}
      next={params.get("next")}
    />
  );
}

export default function LoginPage() {
  const { t } = useT();
  const reduce = useReducedMotion();
  return (
    <PageShell
      header={<LandingHeader />}
      hero={
        <section className="relative isolate overflow-hidden">
          <HeroPhoto tone="auth" />
          <div className="mx-auto flex min-h-[100svh] max-w-lg flex-col px-4 pb-12 pt-[4.6rem] short:pb-6 short:pt-[4.4rem]">
            <Link
              href="/"
              className="mb-2.5 short:mb-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[12.5px] font-semibold text-white ring-1 ring-white/25 backdrop-blur-md transition hover:bg-white/25"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {t("login.backHome")}
            </Link>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <Suspense fallback={<div className="skeleton h-[36rem] rounded-[1.75rem]" />}>
                <AuthFromParams />
              </Suspense>
            </motion.div>
          </div>
          <PhotoCredit className="absolute bottom-4 right-4" />
        </section>
      }
    />
  );
}
