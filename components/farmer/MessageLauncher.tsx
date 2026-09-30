"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, MessageCircle, MessageSquareText, MessagesSquare, X, type LucideIcon } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { tx, type ExtraKey } from "@/lib/i18n/farmerExtras";

const OPTIONS: { href: string; label: ExtraKey; sub: ExtraKey; icon: LucideIcon; tile: string; ring: string }[] = [
  { href: "/farmer/whatsapp", label: "msgWhatsApp", sub: "msgWhatsAppSub", icon: MessageCircle, tile: "bg-[#25d366] text-white", ring: "hover:border-[#25d366]/60 hover:bg-[#25d366]/5" },
  { href: "/farmer/sms", label: "msgSms", sub: "msgSmsSub", icon: MessageSquareText, tile: "bg-blue-600 text-white", ring: "hover:border-blue-300 hover:bg-blue-50/60" },
];

/**
 * Floating round message button shown on every farmer screen. Opens a small
 * menu with SMS and WhatsApp; the chosen chat opens with its
 * "Redirecting to …" hand-off animation.
 */
export function MessageLauncher() {
  const lang = useAppStore((s) => s.lang);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const btn = useRef<HTMLButtonElement>(null);
  const first = useRef<HTMLButtonElement>(null);

  // Warm up both chat screens so the hand-off starts instantly.
  useEffect(() => {
    if (open) OPTIONS.forEach((o) => router.prefetch(o.href));
  }, [open, router]);

  useEffect(() => {
    if (!open) return;
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btn.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      {/* Dim the page behind the menu; tap to close */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[1040] bg-monsoon-950/30"
            aria-hidden
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-[1050] flex flex-col items-end gap-3">
        <AnimatePresence>
          {open && (
            <motion.div
              key="menu"
              id={menuId}
              role="menu"
              aria-label={tx(lang, "msgTitle")}
              initial={{ opacity: 0, y: 12, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              style={{ transformOrigin: "bottom right" }}
              className="w-64 rounded-card border border-line bg-white p-2 shadow-lift"
            >
              <p className="px-2 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{tx(lang, "msgTitle")}</p>
              <ul className="space-y-1.5">
                {OPTIONS.map((o, i) => (
                  <motion.li key={o.href} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 + i * 0.05 }}>
                    <button
                      ref={i === 0 ? first : undefined}
                      type="button"
                      role="menuitem"
                      onClick={() => go(o.href)}
                      className={`flex w-full items-center gap-3 rounded-control border border-line p-2.5 text-left transition ${o.ring}`}
                    >
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full shadow-soft ${o.tile}`}>
                        <o.icon className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1 leading-tight">
                        <span className="block text-[14px] font-bold text-ink">{tx(lang, o.label)}</span>
                        <span className="mt-0.5 block text-[11.5px] text-muted">{tx(lang, o.sub)}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                    </button>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          ref={btn}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          aria-label={open ? tx(lang, "msgClose") : tx(lang, "msgOpen")}
          whileTap={{ scale: 0.92 }}
          className="relative grid h-14 w-14 place-items-center rounded-full bg-leaf-700 text-white shadow-lift ring-4 ring-white transition-colors hover:bg-leaf-800"
        >
          {!open && <span className="absolute inset-1 animate-ping rounded-full bg-leaf-500/20 [animation-duration:3s]" aria-hidden />}
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={open ? "x" : "msg"}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative"
            >
              {open ? <X className="h-6 w-6" aria-hidden /> : <MessagesSquare className="h-6 w-6" aria-hidden />}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>
    </>
  );
}
