"use client";

import { Map as MapIcon } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { NoteChip, PageTitle } from "@/components/ui/Card";
import { RiskMapExplorer } from "@/components/map/RiskMapExplorer";
import { useT } from "@/hooks/useT";
import { HERO_BLOCK_ID } from "@/data/blocks";

export default function MapPage() {
  const { t } = useT();
  return (
    <PageShell wide>
      <PageTitle
        icon={MapIcon}
        title={t("map.title")}
        subtitle="Block-level probabilities for weeks 1-4 · Maharashtra (demo region)"
        action={<NoteChip>Simulated data</NoteChip>}
      />
      <RiskMapExplorer initialBlockId={HERO_BLOCK_ID} markerStyle="dot" fullscreenButton summaryBelowMap />
    </PageShell>
  );
}
