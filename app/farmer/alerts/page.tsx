"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, BellRing, CalendarDays, Check, Clock, CloudLightning, CloudRain, Sun, type LucideIcon } from "lucide-react";
import type { AlertItem, AlertKind, Lang } from "@/types";
import { useAppStore } from "@/lib/store";
import { useT } from "@/hooks/useT";
import { useFarmerData } from "@/hooks/useFarmerData";
import { buildAlerts } from "@/lib/alerts";
import { newId } from "@/lib/ids";
import { fmtDateTime, fmtRange, translate } from "@/lib/i18n";
import { RISK_CLASSES } from "@/lib/riskColors";
import { Card, PageTitle } from "@/components/ui/Card";
import { tx } from "@/lib/i18n/farmerExtras";
import { H3 } from "@/lib/ui";
import { Button } from "@/components/ui/Button";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { CardSkeleton, EmptyState } from "@/components/ui/States";

const KIND_ICON: Record<AlertKind, LucideIcon> = { digest: CalendarDays, break: Sun, heavy: CloudLightning, onset: CloudRain };

/** Resolve "start|end" range params into localised dates. */
function renderAlert(lang: Lang, a: AlertItem) {
  const params = { ...a.params };
  if (typeof params.range === "string" && params.range.includes("|")) {
    const [s, e] = params.range.split("|");
    params.range = fmtRange(lang, s, e);
  }
  return { title: translate(lang, a.titleKey, params), body: translate(lang, a.bodyKey, params) };
}

type Perm = "default" | "granted" | "denied" | "unsupported";
const readPerm = (): Perm => (typeof window === "undefined" || !("Notification" in window) ? "unsupported" : Notification.permission);

export default function AlertsPage() {
  const { t, lang } = useT();
  const pushed = useAppStore((s) => s.alerts);
  const pushAlert = useAppStore((s) => s.pushAlert);
  const markRead = useAppStore((s) => s.markAlertsRead);
  const { block, data } = useFarmerData();
  const [perm, setPerm] = useState<Perm>(readPerm);
  const [toast, setToast] = useState<AlertItem | null>(null);
  // Snapshot of what was already read when the page opened, for the "new" dot.
  const [readAtOpen] = useState(() => new Set(useAppStore.getState().readAlertIds));

  const derived = data && block ? buildAlerts(data.forecast, block) : [];
  const all = [...pushed, ...derived];
  const idsKey = all.map((a) => a.id).join(",");

  // Mark everything as read once the user has seen the list.
  useEffect(() => {
    if (!idsKey) return;
    const timer = window.setTimeout(() => markRead(idsKey.split(",")), 1200);
    return () => window.clearTimeout(timer);
  }, [idsKey, markRead]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const simulate = () => {
    if (!data || !block) return;
    const kinds: AlertKind[] = ["break", "heavy", "digest"];
    const kind = kinds[pushed.length % kinds.length];
    const w = data.forecast.weeks[kind === "break" ? 1 : 0];
    const a: AlertItem = {
      id: newId("push"),
      kind,
      timestamp: new Date().toISOString(),
      titleKey: `alert.${kind}.title`,
      bodyKey: `alert.${kind}.body`,
      params:
        kind === "digest"
          ? { block: `#block:${block.id}`, onset: w.onset, brk: w.breakProb, heavy: w.heavyRain }
          : { p: kind === "break" ? w.breakProb : w.heavyRain, week: w.week, range: `${w.startDate}|${w.endDate}` },
      severity: kind === "break" ? "high" : kind === "heavy" ? "elevated" : "watch",
    };
    pushAlert(a);
    setToast(a);
    if (perm === "granted") {
      const { title, body } = renderAlert(lang, a);
      try {
        new Notification(title, { body, icon: "/icon.svg", tag: a.id });
      } catch {
        /* some mobile browsers require a service worker for notifications */
      }
    }
  };

  const enable = async () => {
    if (perm === "unsupported") return;
    setPerm(await Notification.requestPermission());
  };

  const newCount = all.filter((a) => !readAtOpen.has(a.id)).length;

  return (
    <div className="space-y-5">
      <PageTitle icon={Bell} title={t("alerts.title")} subtitle={t("alerts.subtitle")} />

      {/* Controls: centred, equal-width actions */}
      <Card pad as="div" className="text-center">
        <p className="mx-auto max-w-xs text-[13px] leading-relaxed text-muted">{tx(lang, "alertsControls")}</p>
        <div className="mx-auto mt-3.5 flex w-full max-w-xs flex-col items-stretch gap-2.5">
          <Button size="lg" onClick={simulate} disabled={!data} icon={BellRing} className="w-full">
            {t("alerts.simulate")}
          </Button>
          {perm !== "unsupported" && perm !== "granted" && perm !== "denied" && (
            <Button variant="secondary" size="lg" onClick={enable} icon={Bell} className="w-full">
              {t("alerts.enable")}
            </Button>
          )}
        </div>
        {perm === "granted" && (
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[13px] font-medium text-leaf-700">
            <Check className="h-4 w-4" aria-hidden /> {t("alerts.enabled")}
          </p>
        )}
        {perm === "denied" && <p className="mx-auto mt-3 max-w-xs text-[12.5px] leading-relaxed text-muted">{t("alerts.blocked")}</p>}
      </Card>

      {/* Simulated push banner */}
      <AnimatePresence>
        {toast && (
          <motion.div
            role="alert"
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            className="fixed inset-x-3 top-3 z-[1500] mx-auto max-w-md rounded-card bg-monsoon-950/96 p-3.5 text-white shadow-lift backdrop-blur"
          >
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.07em] text-monsoon-200">
              <BellRing className="h-3.5 w-3.5" aria-hidden /> {t("app.name")} · now
            </p>
            <p className="mt-1.5 text-[14px] font-bold">{renderAlert(lang, toast).title}</p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-monsoon-100">{renderAlert(lang, toast).body}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {!data ? (
        <CardSkeleton lines={3} />
      ) : all.length === 0 ? (
        <EmptyState title={t("alerts.empty")} icon={Bell} />
      ) : (
        <section aria-labelledby="alerts-recent">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <h2 id="alerts-recent" className={H3}>
              {tx(lang, "alertsRecent")} <span className="font-medium text-muted">({all.length})</span>
            </h2>
            {newCount > 0 && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11.5px] font-semibold text-red-700 ring-1 ring-red-200">
                {tx(lang, "alertsNew", { n: newCount })}
              </span>
            )}
          </div>
          <ul className="space-y-3">
            {all.map((a) => {
              const { title, body } = renderAlert(lang, a);
              const Icon = KIND_ICON[a.kind];
              const isNew = !readAtOpen.has(a.id);
              const c = RISK_CLASSES[a.severity];
              return (
                <li key={a.id} className={`flex gap-3 rounded-card border bg-white p-4 shadow-soft ${c.border}`}>
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-control ${c.bg} ${c.text}`}>
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    {/* Title always on its own line; badge + time share a meta row */}
                    <p className="flex items-start gap-2 text-[14.5px] font-bold leading-snug text-ink">
                      {isNew && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-600" aria-label="new" />}
                      <span className="min-w-0">{title}</span>
                    </p>
                    <p className="mt-1 text-[13.5px] leading-relaxed text-body">{body}</p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <RiskBadge level={a.severity} size="sm" />
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock className="h-3 w-3" aria-hidden />
                        {fmtDateTime(lang, a.timestamp)}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
