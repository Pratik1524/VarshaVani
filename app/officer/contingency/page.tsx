"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ClipboardCheck, ListChecks, ListOrdered, PackageSearch, Radar, Target, TrendingUp, type LucideIcon } from "lucide-react";
import type { CropId } from "@/types";
import { DISTRICTS } from "@/data/blocks";
import { CROPS, CROP_IDS } from "@/data/crops";
import { getAllForecasts } from "@/lib/forecastService";
import {
  ALL_DISTRICTS,
  HORIZONS,
  assessDistrict,
  buildChecklist,
  impact,
  leadTimeAccuracy,
  needs,
  planKey,
  rankBlocks,
  situation,
  verification,
  type Horizon,
  type PlannerFilters,
} from "@/lib/contingency";
import { usePlannerHydrated } from "@/lib/contingencyStore";
import { fmtDate } from "@/lib/i18n";
import { useAsync } from "@/hooks/useAsync";
import { CardHeader, PageTitle } from "@/components/ui/Card";
import { Field, Select } from "@/components/ui/Field";
import { PrototypeBadge } from "@/components/ui/Logo";
import { Segmented } from "@/components/ui/Segmented";
import { CardSkeleton, EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { Reveal } from "@/components/ui/Motion";
import { SituationCards } from "@/components/contingency/SituationCards";
import { NeedsCards } from "@/components/contingency/NeedsCards";
import { Checklist } from "@/components/contingency/Checklist";
import { PriorityTable } from "@/components/contingency/PriorityTable";
import { ImpactStrip, ReportCard, SimChip } from "@/components/contingency/ReportAndImpact";
import { usePlannerText } from "@/components/contingency/usePlannerText";

/** Section wrapper: card with icon header and optional right-side chip. */
function Section({ icon, title, subtitle, action, children, delay = 0 }: { icon: LucideIcon; title: string; subtitle?: string; action?: ReactNode; children: ReactNode; delay?: number }) {
  return (
    <Reveal as="section" delay={delay} className="rounded-card border border-line bg-white p-4 shadow-soft sm:p-5">
      <CardHeader icon={icon} title={title} subtitle={subtitle} action={action} as="h2" />
      <div className="mt-4">{children}</div>
    </Reveal>
  );
}

export default function ContingencyPlannerPage() {
  const { c, t, lang } = usePlannerText();
  const [filters, setFilters] = useState<PlannerFilters>({ district: ALL_DISTRICTS, crop: "soybean", horizon: 4 });
  const { data: forecasts, error, reload } = useAsync(getAllForecasts, "all-forecasts");
  const hydrated = usePlannerHydrated();

  const plan = useMemo(() => {
    if (!forecasts) return null;
    const list = assessDistrict(forecasts, filters);
    const calendar = list[0] ? forecasts[list[0].block.id] : undefined;
    return {
      list,
      calendar,
      situation: situation(list),
      needs: needs(list, filters.crop),
      tasks: buildChecklist(list, calendar),
      ranked: rankBlocks(list),
      verification: calendar ? verification(filters, calendar.issuedOn, list.length) : [],
      lead: leadTimeAccuracy(),
      impact: impact(list),
    };
  }, [forecasts, filters]);

  const set = (patch: Partial<PlannerFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const cropName = t(`crop.${filters.crop}`);

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <PageTitle
        icon={ClipboardCheck}
        title={c("title")}
        subtitle={c("subtitle")}
        meta={plan?.calendar ? c("scope", { n: plan.list.length, date: fmtDate(lang, plan.calendar.issuedOn, { day: "numeric", month: "long", year: "numeric" }) }) : undefined}
        action={<PrototypeBadge />}
      />

      {/* 1. Filters */}
      <div className="grid gap-3 rounded-card border border-line bg-white p-4 shadow-soft sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
        <Field label={c("filterDistrict")} htmlFor="cp-district">
          <Select id="cp-district" value={filters.district} onChange={(e) => set({ district: e.target.value })}>
            <option value={ALL_DISTRICTS}>{c("allDistricts")}</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={c("filterCrop")} htmlFor="cp-crop">
          <Select id="cp-crop" value={filters.crop} onChange={(e) => set({ crop: e.target.value as CropId })}>
            {CROP_IDS.map((id) => (
              <option key={id} value={id}>
                {CROPS[id].emoji} {t(`crop.${id}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={c("filterHorizon")} className="sm:col-span-2 lg:col-span-1">
          <Segmented<Horizon>
            label={c("filterHorizon")}
            value={filters.horizon}
            onChange={(h) => set({ horizon: h })}
            options={HORIZONS.map((h) => ({ value: h, label: c("horizon", { n: h }) }))}
          />
        </Field>
      </div>

      {error ? (
        <ErrorState onRetry={reload} />
      ) : !plan ? (
        <div className="space-y-4" aria-busy="true">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-36 rounded-card" />
            ))}
          </div>
          <CardSkeleton lines={6} />
          <CardSkeleton lines={8} />
        </div>
      ) : plan.list.length === 0 ? (
        <EmptyState title={c("noRisk")} description={c("noRiskSub")} icon={PackageSearch} />
      ) : (
        <>
          {/* 2. Situation */}
          <Section icon={Radar} title={c("situationTitle")} subtitle={c("situationSub", { n: filters.horizon })}>
            <SituationCards s={plan.situation} />
          </Section>

          {/* 3. Needs */}
          <Section icon={PackageSearch} title={c("needsTitle")} subtitle={c("needsSub", { crop: cropName })} delay={0.04}>
            <NeedsCards n={plan.needs} crop={filters.crop} />
          </Section>

          {/* 4. Checklist + readiness */}
          <Section icon={ListChecks} title={c("checklistTitle")} subtitle={c("checklistSub")} delay={0.04}>
            <Checklist tasks={plan.tasks} plan={planKey(filters)} crop={filters.crop} needs={plan.needs} hydrated={hydrated} />
          </Section>

          {/* 5. Priority blocks */}
          <Section icon={ListOrdered} title={c("rankTitle")} subtitle={c("rankSub", { crop: cropName })} delay={0.04}>
            <PriorityTable rows={plan.ranked} filters={filters} crop={filters.crop} />
          </Section>

          {/* 6 + 7. Report card and impact */}
          <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
            <Section icon={Target} title={c("reportTitle")} subtitle={c("reportSub")} action={<SimChip label={c("simulated")} />}>
              <ReportCard weeks={plan.verification} lead={plan.lead} />
            </Section>
            <Section icon={TrendingUp} title={c("impactTitle")} subtitle={c("impactSub")}>
              <ImpactStrip impact={plan.impact} crop={filters.crop} />
            </Section>
          </div>
        </>
      )}
    </div>
  );
}
