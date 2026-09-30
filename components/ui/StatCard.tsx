import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { SURFACE } from "@/lib/ui";

const TONES = {
  blue: "bg-monsoon-50 text-monsoon-700",
  green: "bg-leaf-50 text-leaf-700",
  amber: "bg-sun-50 text-sun-600",
  red: "bg-red-50 text-red-600",
  slate: "bg-slate-100 text-slate-600",
} as const;

/** KPI tile: label, large navy figure, supporting hint, tinted icon. */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  tone?: keyof typeof TONES;
}) {
  return (
    <div className={`${SURFACE} p-4`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[12.5px] font-semibold leading-snug text-muted">{label}</p>
        {Icon && (
          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-control ${TONES[tone]}`}>
            <Icon className="h-4 w-4" aria-hidden />
          </span>
        )}
      </div>
      <p className="mt-2 text-[1.75rem] font-bold leading-none tracking-[-0.02em] tabular-nums text-ink">{value}</p>
      {hint && <p className="mt-1.5 text-[11.5px] leading-snug text-muted">{hint}</p>}
    </div>
  );
}
