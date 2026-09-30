"use client";

import type { ReactNode } from "react";
import { CircleAlert, Inbox, type LucideIcon } from "lucide-react";
import { useT } from "@/hooks/useT";
import { MUTED, SURFACE, SURFACE_DASHED } from "@/lib/ui";
import { Button } from "./Button";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-control ${className}`} aria-hidden />;
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className={`${SURFACE} p-4 sm:p-5`} role="status" aria-label="Loading">
      <Skeleton className="h-4 w-1/2" />
      <div className="mt-3.5 space-y-2">
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton key={i} className={`h-3 ${i === lines - 1 ? "w-2/3" : "w-full"}`} />
        ))}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className={`flex flex-col items-center gap-2.5 px-6 py-10 text-center ${SURFACE_DASHED}`}>
      <span className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-400">
        <Icon className="h-5.5 w-5.5" aria-hidden />
      </span>
      <p className="text-[15px] font-semibold text-ink">{title}</p>
      {description && <p className={`max-w-sm ${MUTED}`}>{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export function ErrorState({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  const { t } = useT();
  return (
    <div role="alert" className="flex flex-col items-center gap-2.5 rounded-card border border-red-200 bg-red-50 px-6 py-8 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-red-100 text-red-600">
        <CircleAlert className="h-5.5 w-5.5" aria-hidden />
      </span>
      <p className="text-[15px] font-semibold text-red-900">{message ?? t("common.error")}</p>
      {onRetry && (
        <Button variant="danger" size="sm" onClick={onRetry} className="mt-1">
          {t("common.retry")}
        </Button>
      )}
    </div>
  );
}
