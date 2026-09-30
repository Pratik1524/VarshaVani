/**
 * Channel formatters: turn an Advisory into SMS / WhatsApp text in any
 * language. Used by the farmer SMS view, gateway simulator and officer
 * campaign composer so every channel says the same thing.
 */
import type { Advisory, Block, BlockForecast, Lang, RiskLevel } from "@/types";
import { blockName } from "@/data/blocks";
import { fmtRange, renderMsg, translate } from "./i18n";

export const RISK_EMOJI: Record<RiskLevel, string> = { low: "🟢", watch: "🟡", elevated: "🟠", high: "🔴" };

function headline(lang: Lang, a: Advisory): string {
  return a.decision ? translate(lang, `decision.${a.decision}`) : translate(lang, `type.${a.type}`);
}

/** Short plain-text SMS (aim: 2 SMS segments at most). */
export function buildSms(lang: Lang, a: Advisory, block: Block): string {
  const crop = translate(lang, `crop.${a.crop}`);
  return [
    `${RISK_EMOJI[a.severity]} ${translate(lang, "app.name")} | ${blockName(block, lang)} | ${crop}`,
    `${headline(lang, a)}: ${renderMsg(lang, a.action)}`,
    a.reasons[0] ? renderMsg(lang, a.reasons[0]) : "",
    translate(lang, "sms.menu"),
  ]
    .filter(Boolean)
    .join("\n");
}

/** Richer WhatsApp message with emoji risk indicators and a 2-week summary. */
export function buildWhatsApp(lang: Lang, a: Advisory, block: Block, forecast: BlockForecast): string {
  const crop = translate(lang, `crop.${a.crop}`);
  const weekLines = forecast.weeks.slice(0, 2).map((w) => {
    const label = translate(lang, "common.week", { n: w.week });
    return `📅 *${label}* (${fmtRange(lang, w.startDate, w.endDate)})\n   🌧 ${w.onset}% · ☀️ ${w.breakProb}% · ⛈ ${w.heavyRain}%`;
  });
  return [
    `*🌦 ${translate(lang, "app.name")} – ${blockName(block, lang)}*`,
    `${RISK_EMOJI[a.severity]} *${headline(lang, a)}* – ${crop}`,
    renderMsg(lang, a.action),
    "",
    ...weekLines,
    `🌧 ${translate(lang, "layer.onset")} · ☀️ ${translate(lang, "layer.break")} · ⛈ ${translate(lang, "layer.heavy")}`,
    "",
    `💧 ${renderMsg(lang, a.irrigationTip)}`,
    a.alternatives[0] ? `💡 ${renderMsg(lang, a.alternatives[0])}` : "",
    `❓ ${renderMsg(lang, a.drivers[0])}`,
    "",
    `_${translate(lang, "sms.menu")}_`,
  ]
    .filter((l, i, arr) => l !== "" || (arr[i - 1] !== "" && i > 0))
    .join("\n");
}
