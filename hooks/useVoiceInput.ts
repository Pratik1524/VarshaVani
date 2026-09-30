"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Lang } from "@/types";
import { LANGS } from "@/lib/i18n";

/* Minimal typings: the Web Speech recognition API is not in TS's DOM lib. */
interface RecognitionAlternative {
  transcript: string;
}
interface RecognitionResult {
  isFinal: boolean;
  0: RecognitionAlternative;
}
interface RecognitionEvent {
  resultIndex: number;
  results: { length: number; [i: number]: RecognitionResult };
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type RecognitionCtor = new () => Recognition;

function getCtor(): RecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export type VoiceError = "unsupported" | "denied" | "no-speech" | "other";

/**
 * Speech-to-text for voice messages (Web Speech API). Recognises Indian
 * English, Hindi and Marathi. `stop()` delivers the transcript to `onFinal`;
 * `cancel()` discards it.
 * Note: in Chrome the audio is processed by the browser vendor's speech service.
 */
export function useVoiceInput(lang: Lang, onFinal: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<VoiceError | null>(null);
  const rec = useRef<Recognition | null>(null);
  const finalText = useRef("");
  const liveText = useRef("");
  const deliver = useRef(true);
  const onFinalRef = useRef(onFinal);

  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  useEffect(() => () => rec.current?.abort(), []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    setError(null);
    if (!Ctor) {
      setError("unsupported");
      return;
    }
    rec.current?.abort();
    const r = new Ctor();
    r.lang = LANGS.find((l) => l.code === lang)?.speech ?? "en-IN";
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 1;
    finalText.current = "";
    liveText.current = "";
    deliver.current = true;

    r.onresult = (e) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalText.current += `${res[0].transcript} `;
        else live += res[0].transcript;
      }
      liveText.current = `${finalText.current}${live}`.trim();
      setInterim(liveText.current);
    };
    r.onerror = (e) => {
      if (e.error === "aborted") return;
      setError(e.error === "not-allowed" || e.error === "service-not-allowed" ? "denied" : e.error === "no-speech" ? "no-speech" : "other");
    };
    r.onend = () => {
      setListening(false);
      setInterim("");
      const text = (finalText.current.trim() || liveText.current).trim();
      if (deliver.current && text) onFinalRef.current(text);
      deliver.current = false;
      rec.current = null;
    };

    rec.current = r;
    try {
      r.start();
      setListening(true);
    } catch {
      setError("other");
    }
  }, [lang]);

  /** Finish and send what was heard. */
  const stop = useCallback(() => {
    deliver.current = true;
    rec.current?.stop();
  }, []);

  /** Discard the recording. */
  const cancel = useCallback(() => {
    deliver.current = false;
    rec.current?.abort();
    setListening(false);
    setInterim("");
  }, []);

  return { supported: !!getCtor(), listening, interim, error, start, stop, cancel, clearError: () => setError(null) };
}
