"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { BatteryFull, Signal, Smartphone, Wifi } from "lucide-react";
import { HeroBackdrop, TopoLines } from "@/components/landing/HeroScenery";
import { Logo, PrototypeBadge } from "@/components/ui/Logo";
import { NAV_MESSAGE } from "@/hooks/useEmulator";
import { useT } from "@/hooks/useT";

/** Routes that leave the farmer app entirely: open them in the full window. */
const EXIT_PREFIXES = ["/login", "/officer"];

/** Screen is 390 × 844 CSS px (19.5:9); the bezel adds 12px on each side. */
const BEZEL = 12;
const PHONE_W = 390 + BEZEL * 2;
const PHONE_H = 844 + BEZEL * 2;
/** Breathing room around the phone inside the stage. */
const STAGE_GAP = 24;

const clock = () => new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });

/**
 * Desktop / tablet host for the farmer app: the landing-page scenery with a
 * phone in the middle. The phone screen is an iframe of the same route, so the
 * app gets a true ~390px viewport and every responsive rule behaves exactly
 * as on a real handset.
 */
export function PhoneEmulator() {
  const { t } = useT();
  const frame = useRef<HTMLIFrameElement>(null);
  // Use the router's pathname (window.location can still hold the previous URL
  // during a client navigation). Read once: later URL syncs must not reload the phone.
  const pathname = usePathname();
  const [src] = useState(pathname);
  const [time, setTime] = useState(clock);
  const stage = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  // Fit the 390 × 844 (19.5:9) phone into the available space without
  // distorting it; never scale above 1.
  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const fit = () => {
      const s = Math.min(1, (el.clientHeight - STAGE_GAP) / PHONE_H, (el.clientWidth - STAGE_GAP) / PHONE_W);
      setScale(Math.max(0.3, s));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setTime(clock()), 20_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      const data = e.data as { type?: string; path?: unknown } | null;
      if (!data || data.type !== NAV_MESSAGE || typeof data.path !== "string") return;
      const path = data.path;
      // Same-origin relative paths only.
      if (!path.startsWith("/") || path.startsWith("//")) return;
      if (path === "/" || EXIT_PREFIXES.some((p) => path.startsWith(p))) {
        window.location.assign(path);
        return;
      }
      // Keep the address bar in sync so a refresh reopens the same screen.
      if (path.startsWith("/farmer") && window.location.pathname !== path) {
        window.history.replaceState(null, "", path);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-soil-50">
      {/* Same scenery as the landing hero */}
      <HeroBackdrop className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/30 via-45% to-transparent" />
      <TopoLines className="absolute -top-10 right-0 hidden h-80 w-[32rem] lg:block" />

      {/* Brand + role tag in the top-left corner (floats over the scenery on wide screens). */}
      <div className="relative z-20 flex shrink-0 items-center gap-3 px-5 pt-4 lg:absolute lg:left-0 lg:top-0">
        <Logo href="/" />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-2.5 py-1 text-[11.5px] font-semibold text-slate-600 ring-1 ring-slate-200 backdrop-blur-sm">
          <Smartphone className="h-3.5 w-3.5 text-leaf-600" aria-hidden />
          {t("login.farmer")}
        </span>
      </div>

      {/* Stage: the phone keeps a fixed 390 × 844 screen and is scaled to fit. */}
      <div ref={stage} className="relative z-10 flex min-h-0 flex-1 items-center justify-center">
        <div style={{ width: PHONE_W * scale, height: PHONE_H * scale }} className={scale ? "" : "invisible"}>
        <div
          style={{ width: PHONE_W, height: PHONE_H, transform: `scale(${scale})` }}
          className="origin-top-left rounded-[3.1rem] bg-monsoon-950 p-3 shadow-lift ring-1 ring-black/20"
        >
          <div className="relative flex h-[844px] w-[390px] flex-col overflow-hidden rounded-[2.4rem] bg-white">
            {/* Status bar + dynamic island */}
            <div className="relative flex h-9 shrink-0 items-center justify-between px-7 text-[12px] font-semibold text-ink">
              <span className="tabular-nums">{time}</span>
              <span className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-monsoon-950" aria-hidden />
              <span className="flex items-center gap-1" aria-hidden>
                <Signal className="h-3.5 w-3.5" />
                <Wifi className="h-3.5 w-3.5" />
                <BatteryFull className="h-4 w-4" />
              </span>
            </div>
            <iframe
              ref={frame}
              src={src}
              title={`${t("app.name")} – ${t("login.farmer")}`}
              allow="microphone; autoplay; geolocation"
              className="block w-full flex-1 border-0 bg-canvas"
            />
            {/* Home indicator */}
            <div className="flex h-5 shrink-0 items-center justify-center bg-white" aria-hidden>
              <span className="h-1 w-32 rounded-full bg-monsoon-950/80" />
            </div>
          </div>
        </div>
        </div>
      </div>

      <div className="relative z-10 flex shrink-0 justify-center pb-3 pt-1">
        <PrototypeBadge />
      </div>
    </div>
  );
}
