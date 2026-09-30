"use client";

import { Languages } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { LANGS } from "@/lib/i18n";
import { useT } from "@/hooks/useT";
import { Segmented } from "./Segmented";

/** EN / हि / म switcher. Choice is persisted in localStorage. */
export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const lang = useAppStore((s) => s.lang);
  const setLang = useAppStore((s) => s.setLang);
  const { t } = useT();
  return (
    <div className="flex items-center gap-1.5">
      {!compact && <Languages className="hidden h-4 w-4 text-slate-500 sm:block" aria-hidden />}
      <Segmented
        size="sm"
        label={t("lang.label")}
        value={lang}
        onChange={setLang}
        options={LANGS.map((l) => ({ value: l.code, label: compact ? l.short : l.label, ariaLabel: l.label }))}
      />
    </div>
  );
}
