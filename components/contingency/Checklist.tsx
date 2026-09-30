"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  Droplets,
  Megaphone,
  Package,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Sprout,
  Timer,
  Users,
  Waves,
  type LucideIcon,
} from "lucide-react";
import type { CropId } from "@/types";
import { nextBestAction, readiness, type Needs, type PlanTask, type Priority, type ReadinessLevel, type TaskKind, type TaskStatus } from "@/lib/contingency";
import { usePlannerStore } from "@/lib/contingencyStore";
import { fmtDate } from "@/lib/i18n";
import type { ContingencyKey } from "@/lib/i18n/contingency";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/States";
import { num, usePlannerText } from "./usePlannerText";

const TASK_ICON: Record<TaskKind, LucideIcon> = {
  campaign: Megaphone,
  stock_seed: Package,
  irrigation: Droplets,
  insurance: ShieldAlert,
  meetings: Users,
  drainage: Waves,
  promote_sowing: Sprout,
  review: CalendarClock,
};

const PRIO_CLS: Record<Priority, string> = {
  high: "border-red-200 bg-red-50 text-red-800",
  medium: "border-yellow-200 bg-yellow-50 text-yellow-900",
  low: "border-slate-200 bg-slate-50 text-slate-700",
};

const STATUSES: TaskStatus[] = ["pending", "in_progress", "done"];
const STATUS_CLS: Record<TaskStatus, string> = {
  pending: "bg-white text-ink shadow-soft ring-1 ring-line-strong",
  in_progress: "bg-sun-400 text-sun-950 shadow-soft",
  done: "bg-leaf-700 text-white shadow-soft",
};

const LEVEL_COLOR: Record<ReadinessLevel, { stroke: string; text: string; chip: string }> = {
  not_ready: { stroke: "#f97316", text: "text-orange-700", chip: "border-orange-200 bg-orange-50 text-orange-800" },
  partial: { stroke: "#eab308", text: "text-yellow-800", chip: "border-yellow-200 bg-yellow-50 text-yellow-900" },
  ready: { stroke: "#16a34a", text: "text-green-700", chip: "border-green-200 bg-green-50 text-green-800" },
};

/** Circular 0-100 readiness gauge. */
export function ReadinessRing({ score, level, label }: { score: number; level: ReadinessLevel; label: string }) {
  const R = 52;
  const C = 2 * Math.PI * R;
  const col = LEVEL_COLOR[level];
  return (
    <div className="relative mx-auto h-36 w-36" role="img" aria-label={`${score} / 100 · ${label}`}>
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <circle cx="64" cy="64" r={R} fill="none" stroke="#eef2f7" strokeWidth="12" />
        <motion.circle
          cx="64"
          cy="64"
          r={R}
          fill="none"
          stroke={col.stroke}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: C * (1 - score / 100) }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-[2rem] font-bold leading-none tabular-nums text-ink">{score}</p>
          <p className="text-[10.5px] font-semibold text-muted">/ 100</p>
        </div>
      </div>
    </div>
  );
}

export function Checklist({ tasks, plan, crop, needs, hydrated }: { tasks: PlanTask[]; plan: string; crop: CropId; needs: Needs; hydrated: boolean }) {
  const { c, t, lang } = usePlannerText();
  const saved = usePlannerStore((s) => s.progress[plan]);
  const setStatus = usePlannerStore((s) => s.setStatus);
  const reset = usePlannerStore((s) => s.reset);
  const status = (id: TaskKind): TaskStatus => saved?.[id] ?? "pending";

  const r = readiness(tasks, status);
  const next = nextBestAction(tasks, status);
  const doneCount = tasks.filter((x) => status(x.id) === "done").length;
  const col = LEVEL_COLOR[r.level];
  const cropName = t(`crop.${crop}`);

  const title = (x: PlanTask) => c(`t_${x.id}` as ContingencyKey);
  const detail = (x: PlanTask) => c(`d_${x.id}` as ContingencyKey, { n: x.blocks, crop: cropName, q: num(needs.seedQuintals) });
  const due = (x: PlanTask) => `${c("byDate", { date: fmtDate(lang, x.deadline) })}${x.week ? ` · ${c("beforeWeek", { n: x.week })}` : ""}`;

  if (!hydrated) {
    return (
      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <Skeleton className="h-96 rounded-card" />
        <Skeleton className="h-72 rounded-card" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
      <div className="space-y-3">
        {/* Next best action */}
        <AnimatePresence mode="wait">
          {next ? (
            <motion.div
              key={next.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="relative overflow-hidden rounded-card bg-gradient-to-br from-monsoon-900 to-monsoon-700 p-4 text-white shadow-raise"
              aria-live="polite"
            >
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-sun-200">
                <Sparkles className="h-3.5 w-3.5" aria-hidden /> {c("nextBest")}
              </p>
              <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] font-bold leading-snug">{title(next)}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-monsoon-100">{detail(next)}</p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-sun-200">
                    <Timer className="h-3.5 w-3.5" aria-hidden /> {due(next)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={status(next.id) === "pending" ? CircleDashed : CheckCircle2}
                  onClick={() => setStatus(plan, next.id, status(next.id) === "pending" ? "in_progress" : "done")}
                >
                  {status(next.id) === "pending" ? c("st_in_progress") : c("st_done")}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.p
              key="done"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 rounded-card border border-green-200 bg-green-50 p-4 text-[13.5px] font-semibold text-green-800"
            >
              <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden /> {c("allDone")}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Tasks */}
        <ul className="space-y-2.5">
          {tasks.map((x) => {
            const st = status(x.id);
            const Icon = TASK_ICON[x.id];
            const isNext = next?.id === x.id;
            return (
              <li
                key={x.id}
                className={`rounded-card border bg-white p-3.5 shadow-soft transition ${isNext ? "border-monsoon-300 ring-1 ring-monsoon-200" : "border-line"} ${
                  st === "done" ? "bg-slate-50/70" : ""
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-control ${
                        st === "done" ? "bg-leaf-100 text-leaf-700" : "bg-monsoon-50 text-monsoon-700"
                      }`}
                    >
                      {st === "done" ? <CheckCircle2 className="h-4.5 w-4.5" aria-hidden /> : <Icon className="h-4.5 w-4.5" aria-hidden />}
                    </span>
                    <div className="min-w-0">
                      <p className={`text-[14px] font-bold leading-snug ${st === "done" ? "text-muted line-through decoration-slate-300" : "text-ink"}`}>{title(x)}</p>
                      <p className="mt-0.5 text-[12.5px] leading-relaxed text-body">{detail(x)}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                        <span className={`rounded-full border px-2 py-0.5 ${PRIO_CLS[x.priority]}`}>
                          {c("priority")}: {c(`prio_${x.priority}` as ContingencyKey)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-2 py-0.5 text-body">
                          <CalendarClock className="h-3 w-3" aria-hidden /> {due(x)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Status switch */}
                  <div role="radiogroup" aria-label={`${c("status")}: ${title(x)}`} className="flex shrink-0 gap-1 rounded-full bg-slate-100 p-1">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        role="radio"
                        aria-checked={st === s}
                        onClick={() => setStatus(plan, x.id, s)}
                        className={`min-h-8 rounded-full px-2.5 text-[11.5px] font-semibold transition ${st === s ? STATUS_CLS[s] : "text-muted hover:text-ink"}`}
                      >
                        {c(`st_${s}` as ContingencyKey)}
                      </button>
                    ))}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Readiness */}
      <aside className="order-first h-fit rounded-card border border-line bg-white p-4 text-center shadow-soft lg:sticky lg:top-20 lg:order-none">
        <p className="text-[13px] font-bold text-ink">{c("readinessTitle")}</p>
        <div className="mt-3">
          <ReadinessRing score={r.score} level={r.level} label={c(`ready_${r.level}` as ContingencyKey)} />
        </div>
        <p className={`mx-auto mt-3 w-fit rounded-full border px-3 py-1 text-[12.5px] font-bold ${col.chip}`}>{c(`ready_${r.level}` as ContingencyKey)}</p>
        <p className="mt-2 text-[12px] text-muted">{c("tasksDone", { d: doneCount, n: tasks.length })}</p>
        <p className="mt-3 border-t border-line pt-3 text-[11.5px] leading-relaxed text-muted">{c("readinessNote")}</p>
        <Button variant="ghost" size="sm" icon={RotateCcw} onClick={() => reset(plan)} disabled={!saved} className="mt-2">
          {c("reset")}
        </Button>
      </aside>
    </div>
  );
}
