"use client";

import { CalendarCheck, CalendarDays, Info } from "lucide-react";
import { useActiveCrop } from "@/lib/store";
import { useT } from "@/hooks/useT";
import { useFarmerData } from "@/hooks/useFarmerData";
import { blockName } from "@/data/blocks";
import { WeekTimeline } from "@/components/advisory/WeekTimeline";
import { SowingWindowStrip } from "@/components/advisory/SowingWindowStrip";
import { SowingWindowGuide } from "@/components/advisory/SowingWindowGuide";
import { CropSwitcher } from "@/components/farmer/CropSwitcher";
import { Card, CardHeader, PageTitle } from "@/components/ui/Card";
import { CardSkeleton, ErrorState } from "@/components/ui/States";
import { INSET } from "@/lib/ui";
import { fmtDate } from "@/lib/i18n";

export default function OutlookPage() {
  const { t, lang } = useT();
  const crop = useActiveCrop();
  const { block, data, error, reload } = useFarmerData();

  return (
    <div className="space-y-5">
      <PageTitle
        icon={CalendarDays}
        title={t("outlook.title")}
        subtitle={
          <>
            {t("outlook.subtitle", { block: blockName(block, lang) })}
            {data && <> · {t("common.issued", { date: fmtDate(lang, data.forecast.issuedOn) })}</>}
          </>
        }
      />
      {error ? (
        <ErrorState onRetry={reload} />
      ) : !data ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <CardSkeleton key={i} lines={4} />
          ))}
        </div>
      ) : (
        <>
          <WeekTimeline forecast={data.forecast} />
          <p className={`flex items-start gap-2 px-3 py-2.5 text-[12.5px] leading-relaxed text-body ${INSET}`}>
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
            {t("outlook.skillNote")}
          </p>

          <Card pad>
            <CardHeader
              icon={CalendarCheck}
              title={t("optimizer.title")}
              subtitle={crop ? t("optimizer.subtitle", { crop: t(`crop.${crop.crop}`), block: blockName(block, lang) }) : undefined}
            />
            <div className="mt-4">
              <CropSwitcher />
            </div>
            {crop && (
              <div className="mt-4">
                <SowingWindowStrip crop={crop.crop} forecast={data.forecast} opts={{ drivers: data.drivers, block }} />
                <SowingWindowGuide crop={crop.crop} forecast={data.forecast} opts={{ drivers: data.drivers, block }} />
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
