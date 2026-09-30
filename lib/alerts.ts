import type { AlertItem, Block, BlockForecast } from "@/types";
import { riskFromProb } from "./riskColors";

/**
 * Derive farmer alerts (weekly digest, break, heavy rain, onset) from a
 * block forecast. IDs are deterministic so "read" state survives reloads.
 */
export function buildAlerts(forecast: BlockForecast, block: Block): AlertItem[] {
  const out: AlertItem[] = [];
  const w1 = forecast.weeks[0];
  const issued = `${forecast.issuedOn}T07:00:00+05:30`;

  out.push({
    id: `${block.id}:digest:${forecast.issuedOn}`,
    kind: "digest",
    timestamp: issued,
    titleKey: "alert.digest.title",
    bodyKey: "alert.digest.body",
    params: { block: `#block:${block.id}`, onset: w1.onset, brk: w1.breakProb, heavy: w1.heavyRain },
    severity: riskFromProb(Math.max(w1.breakProb, w1.heavyRain)),
  });

  for (const w of forecast.weeks) {
    const range = `${w.startDate}|${w.endDate}`;
    if (w.breakProb >= 60) {
      out.push({
        id: `${block.id}:break:w${w.week}:${forecast.issuedOn}`,
        kind: "break",
        timestamp: issued,
        titleKey: "alert.break.title",
        bodyKey: "alert.break.body",
        params: { p: w.breakProb, week: w.week, range },
        severity: riskFromProb(w.breakProb),
      });
    }
    if (w.heavyRain >= 60) {
      out.push({
        id: `${block.id}:heavy:w${w.week}:${forecast.issuedOn}`,
        kind: "heavy",
        timestamp: issued,
        titleKey: "alert.heavy.title",
        bodyKey: "alert.heavy.body",
        params: { p: w.heavyRain, week: w.week, range },
        severity: riskFromProb(w.heavyRain),
      });
    }
    if (w.onset >= 70 && w.week <= 2) {
      out.push({
        id: `${block.id}:onset:w${w.week}:${forecast.issuedOn}`,
        kind: "onset",
        timestamp: issued,
        titleKey: "alert.onset.title",
        bodyKey: "alert.onset.body",
        params: { p: w.onset, week: w.week, range },
        severity: "low",
      });
    }
  }
  return out;
}
