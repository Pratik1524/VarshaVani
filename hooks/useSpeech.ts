"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Lang } from "@/types";
import { LANGS } from "@/lib/i18n";

export type SpeechStatus = "idle" | "speaking" | "unavailable" | "fallback";

/**
 * Browser text-to-speech (Web Speech API) that works reliably for English,
 * Hindi and Marathi:
 *
 *  - Voices: ranked per language (exact locale > same language > Hindi for
 *    Marathi, since both use Devanagari), preferring natural / neural /
 *    enhanced voices. If a voice fails (e.g. an online voice with no
 *    network), the next one is tried automatically.
 *  - Long text is split into short sentences and spoken as a queue. Chrome's
 *    online voices (e.g. "Google हिन्दी", often the only Hindi voice on
 *    Windows / Android) stop after ~15 s or fail silently on long text.
 *  - Waits for the voice list to load before the first utterance, and leaves
 *    a short gap after cancel() (Chrome drops speech started right after it).
 *  - The utterance language always matches the chosen voice.
 *  - Numbers, ranges and symbols are written out so they are read naturally.
 */

/* ---------------- Voices ---------------- */

const norm = (s: string) => s.toLowerCase().replace("_", "-");

/** Higher-quality engines advertise themselves in the voice name. */
const QUALITY = /natural|neural|premium|enhanced|wavenet|siri/i;
/** Novelty / low-quality macOS voices. */
const NOVELTY = /albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley/i;

/** Voices that failed this session (e.g. an online voice while offline); skipped next time. */
const failedVoices = new Set<string>();
const voiceKey = (v: SpeechSynthesisVoice) => `${v.name}|${v.lang}`;
const isOnline = () => typeof navigator === "undefined" || navigator.onLine !== false;

function scoreVoice(v: SpeechSynthesisVoice, lang: Lang): number {
  const tag = norm(LANGS.find((l) => l.code === lang)!.speech); // en-in / hi-in / mr-in
  const vl = norm(v.lang);
  const base = vl.split("-")[0];
  let s = -1;
  if (vl === tag) s = 100;
  else if (base === lang) s = 80;
  else if (lang === "mr" && base === "hi") s = 60; // Devanagari fallback
  else if (lang === "en" && base === "en") s = vl.endsWith("-gb") || vl.endsWith("-au") ? 45 : 40;
  if (s < 0) return -1;
  if (QUALITY.test(v.name)) s += 10;
  if (NOVELTY.test(v.name)) s -= 30;
  if (lang === "en") {
    // English: offline voices (Rishi, Samantha…) are already clear and start instantly.
    if (v.localService) s += 8;
  } else if (!v.localService) {
    // Hindi / Marathi: the online "Google हिन्दी" voice pronounces Devanagari far
    // better than the old offline ones (e.g. macOS "Lekha"). Use it when online;
    // offline voices remain the automatic fallback.
    s += isOnline() ? 15 : -15;
  } else s += 4;
  if (failedVoices.has(voiceKey(v))) s -= 50;
  return s;
}

/** Candidate voices for a language, best first. Empty = none can read it. */
export function rankVoices(voices: SpeechSynthesisVoice[], lang: Lang): SpeechSynthesisVoice[] {
  return voices
    .map((v) => ({ v, s: scoreVoice(v, lang) }))
    .filter((x) => x.s >= 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.v);
}

const isExact = (v: SpeechSynthesisVoice, lang: Lang) => norm(v.lang).split("-")[0] === lang;

/** Resolve the voice list, waiting briefly for browsers that load it async. */
function loadVoices(synth: SpeechSynthesis, timeoutMs = 1500): Promise<SpeechSynthesisVoice[]> {
  const now = synth.getVoices();
  if (now.length) return Promise.resolve(now);
  return new Promise((resolve) => {
    const done = () => {
      synth.removeEventListener?.("voiceschanged", done);
      window.clearTimeout(timer);
      resolve(synth.getVoices());
    };
    const timer = window.setTimeout(done, timeoutMs);
    synth.addEventListener?.("voiceschanged", done);
  });
}

/* ---------------- Text ---------------- */

const RANGE_WORD: Record<Lang, string> = { en: " to ", hi: " से ", mr: " ते " };
const PERCENT: Record<Lang, string> = { en: " percent", hi: " प्रतिशत", mr: " टक्के" };
const DEGREE: Record<Lang, string> = { en: " degrees", hi: " डिग्री", mr: " अंश" };

/** Make text read naturally: ranges, units and symbols in words; no emoji / markup. */
const D = "[0-9०-९]"; // Latin or Devanagari digit

export function speechText(text: string, lang: Lang): string {
  return (
    text
      .replace(/[\p{Extended_Pictographic}\u200d\uFE0F]/gu, "")
      .replace(/[*_•·|#]/g, " ")
      // Phone numbers (e.g. 1800-180-1551): read digit groups, not as a range.
      .replace(new RegExp(`(${D}{3,})[–-](${D}{2,})[–-](${D}{3,})`, "g"), "$1, $2, $3")
      // Short numeric ranges "10-14" → "10 to 14" / "10 से 14" / "10 ते 14".
      .replace(new RegExp(`(?<!${D}|[–-])(${D}{1,3})\\s*[–-]\\s*(${D}{1,3})(?!${D}|[–-])`, "g"), `$1${RANGE_WORD[lang]}$2`)
      .replace(new RegExp(`(${D})\\s*°C`, "g"), `$1${DEGREE[lang]}`)
      .replace(new RegExp(`(${D})\\s*%`, "g"), `$1${PERCENT[lang]}`)
      .replace(/\s*\n+\s*/g, lang === "en" ? ". " : "। ")
      // Tidy doubled sentence marks left by joined lines ("।." / "..").
      .replace(/([.!?।])\s*[.।]+/g, "$1")
      .replace(/\s{2,}/g, " ")
      .trim()
  );
}

/**
 * Marathi read by a Hindi voice: swap Marathi-only letters for the closest
 * sounds Hindi voices know, so words are not skipped or garbled.
 *   ळ → ल (retroflex L, often silently dropped), ॲ/ॅ → ऐ/े (English "a" in e.g. व्हॉट्सॲप)
 */
export function adaptForHindiVoice(text: string): string {
  return text.replace(/ळ/g, "ल").replace(/ॲ/g, "ऐ").replace(/ॅ/g, "े");
}

/** Split into short sentence-sized chunks (online voices cut long utterances). */
export function chunkText(text: string, max = 160): string[] {
  // Split after a sentence mark followed by a space or the end, so decimals
  // ("1.5", "१.५") and abbreviations stay in one piece.
  const sentences = text
    .split(/(?<=[.!?।॥;])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const out: string[] = [];
  for (const s of sentences) {
    if (s.length <= max) {
      // Merge very short fragments with the previous chunk.
      if (out.length && out[out.length - 1].length + s.length + 1 <= max && s.length < 40) out[out.length - 1] += ` ${s}`;
      else out.push(s);
      continue;
    }
    // Long sentence: break at commas, then at spaces.
    let buf = "";
    for (const part of s.split(/(?<=[,،])\s+|\s+/)) {
      if ((buf + " " + part).trim().length > max && buf) {
        out.push(buf.trim());
        buf = part;
      } else buf = `${buf} ${part}`;
    }
    if (buf.trim()) out.push(buf.trim());
  }
  return out;
}

const RATE: Record<Lang, number> = { en: 0.95, hi: 0.9, mr: 0.88 };

/* ---------------- Hook ---------------- */

export function useSpeech() {
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [activeId, setActiveId] = useState<string | null>(null);
  /** Increments on every speak/stop so callbacks from an old run are ignored. */
  const run = useRef(0);
  /** Watchdog for a voice that never starts speaking. */
  const watchdog = useRef<number | undefined>(undefined);
  const mine = useRef(false);

  const clearWatchdog = () => {
    window.clearTimeout(watchdog.current);
    watchdog.current = undefined;
  };

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    // Trigger voice loading early so the first Listen is instant.
    void loadVoices(window.speechSynthesis);
    const runs = run; // counter ref, not a DOM node
    return () => {
      runs.current++;
      clearWatchdog();
      // Only stop speech this instance started.
      if (mine.current) window.speechSynthesis.cancel();
    };
  }, []);

  const stop = useCallback(() => {
    run.current++;
    clearWatchdog();
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    mine.current = false;
    setActiveId(null);
    setStatus("idle");
  }, []);

  const speak = useCallback((id: string, text: string, lang: Lang) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setActiveId(id);
      setStatus("unavailable");
      return;
    }
    const synth = window.speechSynthesis;
    const myRun = ++run.current;
    clearWatchdog();
    synth.cancel();
    mine.current = true;
    setActiveId(id);
    setStatus("speaking");

    const chunks = chunkText(speechText(text, lang));
    if (!chunks.length) {
      setActiveId(null);
      setStatus("idle");
      return;
    }

    void loadVoices(synth).then((voices) => {
      if (run.current !== myRun) return;
      const candidates = rankVoices(voices, lang);
      if (voices.length && !candidates.length) {
        // Voices exist, but none can read this script.
        setStatus("unavailable");
        mine.current = false;
        return;
      }

      let vIndex = 0;
      let cIndex = 0;
      let started = false;
      /** Identifies the utterance currently in flight; stale events are ignored. */
      let token = 0;

      const finish = (s: SpeechStatus) => {
        if (run.current !== myRun) return;
        clearWatchdog();
        mine.current = false;
        setStatus(s);
        if (s === "idle") setActiveId((cur) => (cur === id ? null : cur));
      };

      /** Current voice failed: remember it and try the next candidate for the same chunk. */
      const nextVoice = () => {
        clearWatchdog();
        const bad = candidates[vIndex];
        if (bad) failedVoices.add(voiceKey(bad));
        if (vIndex + 1 < candidates.length) {
          vIndex++;
          token++; // invalidate events from the abandoned utterance
          synth.cancel();
          window.setTimeout(sayNext, 80);
        } else {
          synth.cancel();
          finish("unavailable");
        }
      };

      const sayNext = () => {
        if (run.current !== myRun) return;
        if (cIndex >= chunks.length) return finish("idle");
        const voice = candidates[vIndex];
        const my = ++token;
        let chunkStarted = false;
        const readsAsHindi = lang === "mr" && !!voice && norm(voice.lang).startsWith("hi");
        const u = new SpeechSynthesisUtterance(readsAsHindi ? adaptForHindiVoice(chunks[cIndex]) : chunks[cIndex]);
        // Keep lang and voice consistent (some engines stay silent on a mismatch).
        u.lang = voice?.lang ?? LANGS.find((l) => l.code === lang)!.speech;
        if (voice) u.voice = voice;
        u.rate = RATE[lang];
        u.pitch = 1;
        u.volume = 1;
        u.onstart = () => {
          if (run.current !== myRun || my !== token) return;
          chunkStarted = true;
          clearWatchdog();
          if (!started) {
            started = true;
            setStatus(!voice || isExact(voice, lang) ? "speaking" : "fallback");
          }
        };
        u.onend = () => {
          if (run.current !== myRun || my !== token) return;
          clearWatchdog();
          // Ended instantly without starting = the voice silently failed. (Some
          // engines skip the start event but still speak; they take longer.)
          if (!chunkStarted && performance.now() - queuedAt < 250) return nextVoice();
          if (!started) {
            started = true;
            setStatus(!voice || isExact(voice, lang) ? "speaking" : "fallback");
          }
          cIndex++;
          sayNext();
        };
        u.onerror = (e) => {
          if (run.current !== myRun || my !== token) return;
          // Cancelled from elsewhere (another Listen button, page change): just stop.
          if (e.error === "interrupted" || e.error === "canceled") return finish("idle");
          nextVoice();
        };
        const queuedAt = performance.now();
        synth.speak(u);
        // Some voices never fire start or error. Give up after a few seconds
        // (online voices can take ~1.5 s to start; allow more), unless the
        // engine reports it is actually speaking.
        clearWatchdog();
        watchdog.current = window.setTimeout(
          () => {
            if (run.current !== myRun || my !== token || chunkStarted) return;
            if (synth.speaking && !synth.pending) {
              chunkStarted = true; // start event was just not fired
              return;
            }
            nextVoice();
          },
          voice && !voice.localService ? 7000 : 4000,
        );
      };

      // Chrome drops an utterance queued in the same tick as cancel().
      window.setTimeout(sayNext, 80);
    });
  }, []);

  return { speak, stop, status, activeId };
}
