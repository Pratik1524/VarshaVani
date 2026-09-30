"use client";

import { useCallback } from "react";
import { useT } from "@/hooks/useT";
import { tc, type ContingencyKey } from "@/lib/i18n/contingency";

/** Planner copy (`c`) plus the app's main translator (`t`) in the current language. */
export function usePlannerText() {
  const { t, lang } = useT();
  const c = useCallback((key: ContingencyKey, params?: Record<string, string | number>) => tc(lang, key, params), [lang]);
  return { c, t, lang };
}

/** Indian digit grouping, Latin numerals (matches the rest of the app). */
export const num = (n: number) => n.toLocaleString("en-IN");
