import type { Advisory, Lang, Msg } from "@/types";
import { BLOCK_BY_ID, blockName } from "@/data/blocks";
import { en, type TKey } from "./en";
import { hi } from "./hi";
import { mr } from "./mr";

export type { TKey };

export const DICTS: Record<Lang, Record<TKey, string>> = { en, hi, mr };

export const LANGS: { code: Lang; label: string; short: string; speech: string; locale: string }[] = [
  { code: "en", label: "English", short: "EN", speech: "en-IN", locale: "en-IN" },
  { code: "hi", label: "हिंदी", short: "हि", speech: "hi-IN", locale: "hi-IN" },
  { code: "mr", label: "मराठी", short: "म", speech: "mr-IN", locale: "mr-IN" },
];

export const localeOf = (lang: Lang) => LANGS.find((l) => l.code === lang)?.locale ?? "en-IN";

type Params = Record<string, string | number>;

function resolveParam(lang: Lang, v: string | number): string {
  if (typeof v === "number") return String(v);
  if (v.startsWith("@")) return translate(lang, v.slice(1) as TKey);
  if (v.startsWith("#block:")) return blockName(BLOCK_BY_ID[v.slice(7)], lang);
  return v;
}

/** Translate a key with {param} interpolation. Falls back to English, then the key. */
export function translate(lang: Lang, key: TKey | string, params?: Params): string {
  const dict = DICTS[lang] as Record<string, string>;
  const template = dict[key] ?? (en as Record<string, string>)[key] ?? key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    params[name] !== undefined ? resolveParam(lang, params[name]) : `{${name}}`,
  );
}

export const renderMsg = (lang: Lang, msg: Msg) => translate(lang, msg.key, msg.params);

/** Format an ISO date as "12 Jun" in the given language. */
export function fmtDate(lang: Lang, iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString(localeOf(lang), { numberingSystem: "latn", ...opts, timeZone: "UTC" });
}

/** Format a full timestamp (local time) e.g. "12 Jun, 09:30". */
export function fmtDateTime(lang: Lang, iso: string) {
  return new Date(iso).toLocaleString(localeOf(lang), { numberingSystem: "latn", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export const fmtRange = (lang: Lang, a: string, b: string) => `${fmtDate(lang, a)} – ${fmtDate(lang, b)}`;

/** Plain-text advisory for voice, SMS and WhatsApp. */
export function advisoryToText(lang: Lang, a: Advisory, opts: { includeWhy?: boolean } = {}): string {
  const parts = [renderMsg(lang, a.action), ...a.reasons.slice(0, 2).map((r) => renderMsg(lang, r)), renderMsg(lang, a.irrigationTip)];
  if (opts.includeWhy) parts.push(renderMsg(lang, a.drivers[0]));
  return parts.join(" ");
}
