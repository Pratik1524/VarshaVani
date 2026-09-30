"use client";

import { useAppStore } from "@/lib/store";
import { getFeedback, getMessageLog } from "@/lib/forecastService";
import { useAsync } from "./useAsync";

/** Seed message log (service) + campaigns sent in this browser (store). */
export function useMessageLog() {
  const local = useAppStore((s) => s.messages);
  const { data, loading } = useAsync(getMessageLog, "messages");
  return { messages: [...local, ...(data ?? [])], loading };
}

/** Seed feedback (service) + feedback given in this browser (store). */
export function useFeedbackLog() {
  const local = useAppStore((s) => s.feedback);
  const { data, loading } = useAsync(getFeedback, "feedback");
  return { feedback: [...local, ...(data ?? [])], loading };
}
