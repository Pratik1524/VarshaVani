"use client";

import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import type { Advisory } from "@/types";
import { useAppStore } from "@/lib/store";
import { useT } from "@/hooks/useT";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

/** "Was this advisory useful?" thumbs + optional comment. Stored locally. */
export function FeedbackWidget({ advisory }: { advisory: Advisory }) {
  const { t, lang } = useT();
  const addFeedback = useAppStore((s) => s.addFeedback);
  const existing = useAppStore((s) => s.feedback.find((f) => f.id === `fb-${advisory.id}`));
  const [choice, setChoice] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");

  if (existing) {
    return (
      <p role="status" className="flex items-center gap-2 rounded-control border border-leaf-200 bg-leaf-50 px-3 py-2 text-[13px] font-medium text-leaf-800">
        {existing.useful ? <ThumbsUp className="h-4 w-4 shrink-0" aria-hidden /> : <ThumbsDown className="h-4 w-4 shrink-0" aria-hidden />}
        {t("feedback.thanks")}
      </p>
    );
  }

  const submit = (useful: boolean) =>
    addFeedback({
      id: `fb-${advisory.id}`,
      timestamp: new Date().toISOString(),
      blockId: advisory.blockId,
      crop: advisory.crop,
      advisoryType: advisory.type,
      useful,
      comment: comment.trim() || undefined,
      lang,
    });

  return (
    <div className="space-y-2.5">
      <p className="text-[13px] font-semibold text-ink">{t("feedback.question")}</p>
      <div className="flex gap-2">
        {[true, false].map((val) => (
          <button
            key={String(val)}
            type="button"
            onClick={() => setChoice(val)}
            aria-pressed={choice === val}
            className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-control border text-[13px] font-semibold transition ${
              choice === val
                ? val
                  ? "border-green-600 bg-green-600 text-white"
                  : "border-red-600 bg-red-600 text-white"
                : "border-line-strong bg-white text-body hover:border-leaf-400 hover:bg-leaf-50/60"
            }`}
          >
            {val ? <ThumbsUp className="h-4 w-4" aria-hidden /> : <ThumbsDown className="h-4 w-4" aria-hidden />}
            {val ? t("feedback.yes") : t("feedback.no")}
          </button>
        ))}
      </div>
      {choice !== null && (
        <div className="flex gap-2">
          <label className="sr-only" htmlFor={`fb-c-${advisory.id}`}>
            {t("feedback.comment")}
          </label>
          <Input
            id={`fb-c-${advisory.id}`}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("feedback.comment")}
            maxLength={280}
            className="flex-1"
          />
          <Button size="md" onClick={() => submit(choice)}>
            {t("feedback.submit")}
          </Button>
        </div>
      )}
    </div>
  );
}
