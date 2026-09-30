"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useAppStore, useActiveCrop } from "@/lib/store";
import { CROPS } from "@/data/crops";
import { useT } from "@/hooks/useT";

/** Horizontal chips to pick which of "My crops" drives the home card. */
export function CropSwitcher() {
  const { t } = useT();
  const crops = useAppStore((s) => s.crops);
  const setActive = useAppStore((s) => s.setActiveCrop);
  const active = useActiveCrop();
  return (
    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label={t("common.selectCrop")}>
      {crops.map((c) => {
        const on = c.id === active?.id;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => setActive(c.id)}
            aria-pressed={on}
            className={`flex min-h-12 shrink-0 items-center gap-2 rounded-control border px-3 text-[13px] font-semibold transition ${
              on ? "border-leaf-500 bg-leaf-50 text-leaf-900 shadow-soft" : "border-line bg-white text-body hover:border-line-strong"
            }`}
          >
            <span className="text-lg" aria-hidden>
              {CROPS[c.crop].emoji}
            </span>
            <span className="text-left leading-tight">
              {t(`crop.${c.crop}`)}
              <span className="block text-[11px] font-medium text-muted">{t(`stage.${c.stage}`)}</span>
            </span>
          </button>
        );
      })}
      <Link
        href="/farmer/crops"
        className="flex min-h-12 shrink-0 items-center gap-1.5 rounded-control border border-dashed border-line-strong px-3 text-[13px] font-semibold text-muted transition hover:border-leaf-400 hover:text-leaf-700"
      >
        <Plus className="h-4 w-4" aria-hidden /> {t("crops.add")}
      </Link>
    </div>
  );
}
