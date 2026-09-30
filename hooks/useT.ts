"use client";

import { useCallback } from "react";
import type { Lang, Msg } from "@/types";
import { useAppStore } from "@/lib/store";
import { renderMsg, translate, type TKey } from "@/lib/i18n";

/** Translation hook bound to the persisted language. */
export function useT() {
  const lang = useAppStore((s) => s.lang);
  const t = useCallback(
    (key: TKey, params?: Record<string, string | number>) => translate(lang, key, params),
    [lang],
  );
  const tm = useCallback((msg: Msg) => renderMsg(lang, msg), [lang]);
  return { t, tm, lang: lang as Lang };
}
