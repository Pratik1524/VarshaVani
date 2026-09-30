"use client";

import { Map as MapIcon } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useT } from "@/hooks/useT";
import { PageTitle } from "@/components/ui/Card";
import { RiskMapExplorer } from "@/components/map/RiskMapExplorer";

export default function FarmerMapPage() {
  const { t } = useT();
  const blockId = useAppStore((s) => s.blockId);
  const setBlockId = useAppStore((s) => s.setBlockId);
  return (
    <div>
      <PageTitle icon={MapIcon} title={t("map.title")} subtitle={t("map.tap")} />
      <RiskMapExplorer stacked initialBlockId={blockId} homeBlockId={blockId} onSetHome={setBlockId} mapClassName="h-[380px] sm:h-[460px]" />
    </div>
  );
}
