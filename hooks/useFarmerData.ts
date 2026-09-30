"use client";

import type { BlockForecast, ClimateDrivers } from "@/types";
import { useAppStore } from "@/lib/store";
import { getCachedForecast, getDrivers, getForecast } from "@/lib/forecastService";
import { BLOCK_BY_ID } from "@/data/blocks";
import { useAsync } from "./useAsync";

/**
 * Forecast + drivers for the farmer's selected block.
 * Falls back to the last forecast saved in the browser if the service fails
 * (e.g. offline with a real API).
 */
export function useFarmerData() {
  const blockId = useAppStore((s) => s.blockId);
  const block = BLOCK_BY_ID[blockId];
  const res = useAsync<{ forecast: BlockForecast; drivers: ClimateDrivers; fromCache: boolean }>(async () => {
    const drivers = await getDrivers();
    try {
      return { forecast: await getForecast(blockId), drivers, fromCache: false };
    } catch (e) {
      const cached = getCachedForecast();
      if (cached && cached.forecast.blockId === blockId) return { forecast: cached.forecast, drivers, fromCache: true };
      throw e;
    }
  }, `farmer:${blockId}`);
  // Hide stale data from a previously selected block.
  const data = res.data && res.data.forecast.blockId === blockId ? res.data : undefined;
  return { block, ...res, data };
}
