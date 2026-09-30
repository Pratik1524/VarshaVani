"use client";

import dynamic from "next/dynamic";
import type { BlockMapProps } from "./BlockMapLeaflet";

/** Client-only Leaflet map (ssr: false) with a skeleton while loading. */
export const BlockMap = dynamic<BlockMapProps>(() => import("./BlockMapLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="skeleton grid h-[420px] w-full place-items-center rounded-2xl text-sm font-medium text-slate-500" role="status">
      Loading map…
    </div>
  ),
});

export type { BlockMapProps };
