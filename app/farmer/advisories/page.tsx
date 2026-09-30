"use client";

import { useState } from "react";
import { Sprout } from "lucide-react";
import type { Week } from "@/types";
import { WEEKS } from "@/types";
import { useAppStore } from "@/lib/store";
import { useT } from "@/hooks/useT";
import { useFarmerData } from "@/hooks/useFarmerData";
import { getAdvisory } from "@/lib/advisoryEngine";
import { blockName } from "@/data/blocks";
import { fmtRange } from "@/lib/i18n";
import { AdvisoryCard } from "@/components/advisory/AdvisoryCard";
import { PageTitle } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/ui/States";

export default function AdvisoriesPage() {
  const { t, lang } = useT();
  const crops = useAppStore((s) => s.crops);
  const [week, setWeek] = useState<Week>(1);
  const { block, data, error, reload } = useFarmerData();
  const w = data?.forecast.weeks[week - 1];

  return (
    <div className="space-y-4">
      <PageTitle icon={Sprout} title={t("advice.title")} subtitle={t("advice.subtitle", { block: blockName(block, lang) })} />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[13px] font-semibold text-ink">{t("advice.week")}:</span>
        <Segmented<Week>
          label={t("advice.week")}
          value={week}
          onChange={setWeek}
          options={WEEKS.map((n) => ({ value: n, label: t("common.weekShort", { n }), ariaLabel: t("common.week", { n }) }))}
        />
        {w && <span className="text-[12.5px] text-muted">{fmtRange(lang, w.startDate, w.endDate)}</span>}
      </div>

      {error ? (
        <ErrorState onRetry={reload} />
      ) : crops.length === 0 ? (
        <EmptyState
          title={t("advice.empty")}
          icon={Sprout}
          action={
            <ButtonLink href="/farmer/crops" size="lg" icon={Sprout}>
              {t("advice.addCrop")}
            </ButtonLink>
          }
        />
      ) : !data ? (
        <CardSkeleton lines={6} />
      ) : (
        <div className="space-y-4">
          {crops.map((c) => (
            <AdvisoryCard
              key={`${c.id}:${week}`}
              advisory={getAdvisory(c.crop, c.stage, data.forecast, week, { drivers: data.drivers, block })}
              defaultOpen={crops.length === 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
