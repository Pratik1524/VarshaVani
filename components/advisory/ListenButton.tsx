"use client";

import { Square, Volume2 } from "lucide-react";
import { useSpeech } from "@/hooks/useSpeech";
import { useT } from "@/hooks/useT";
import { Button } from "@/components/ui/Button";

/** "Listen" button using the browser's speechSynthesis in the current language. */
export function ListenButton({ id, text }: { id: string; text: string }) {
  const { t, lang } = useT();
  const { speak, stop, status, activeId } = useSpeech();
  const mine = activeId === id;
  const speaking = mine && (status === "speaking" || status === "fallback");

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant={speaking ? "danger" : "secondary"}
        size="sm"
        onClick={() => (speaking ? stop() : speak(id, text, lang))}
        aria-pressed={speaking}
        icon={speaking ? Square : Volume2}
      >
        {speaking ? t("common.stop") : t("common.listen")}
      </Button>
      {mine && (status === "unavailable" || status === "fallback") && (
        <p role="status" className="max-w-60 text-right text-[11px] font-medium text-muted">
          {status === "unavailable" ? t("voice.unavailable") : t("voice.fallback")}
        </p>
      )}
    </div>
  );
}
