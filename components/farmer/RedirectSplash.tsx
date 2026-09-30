"use client";

import { motion } from "framer-motion";
import { MessageCircle, MessageSquareText } from "lucide-react";
import type { Channel } from "@/types";
import { useAppStore } from "@/lib/store";
import { tx } from "@/lib/i18n/farmerExtras";

/** How long the hand-off screen stays up before the chat is revealed (ms). */
export const REDIRECT_MS = 1600;

const THEME: Record<Channel, { bg: string; ring: string; bar: string; icon: typeof MessageCircle }> = {
  whatsapp: { bg: "bg-[#075e54]", ring: "bg-[#25d366]", bar: "bg-[#25d366]", icon: MessageCircle },
  sms: { bg: "bg-blue-600", ring: "bg-blue-300", bar: "bg-white", icon: MessageSquareText },
};

/**
 * Full-screen "Redirecting to WhatsApp / SMS" hand-off shown for a moment
 * before the chat opens. Purely visual; the chat is already mounted beneath.
 */
export function RedirectSplash({ channel }: { channel: Channel }) {
  const lang = useAppStore((s) => s.lang);
  const theme = THEME[channel];
  const Icon = theme.icon;

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={`absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 px-8 text-center text-white ${theme.bg}`}
    >
      {/* Icon with expanding pulse rings */}
      <div className="relative grid h-28 w-28 place-items-center">
        {[0, 0.5].map((delay) => (
          <motion.span
            key={delay}
            className={`absolute inset-0 rounded-full ${theme.ring}`}
            initial={{ scale: 0.6, opacity: 0.55 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 1.3, repeat: Infinity, ease: "easeOut", delay }}
            aria-hidden
          />
        ))}
        <motion.span
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="relative grid h-20 w-20 place-items-center rounded-full bg-white shadow-lift"
        >
          <Icon className={`h-10 w-10 ${channel === "whatsapp" ? "text-[#075e54]" : "text-blue-600"}`} aria-hidden />
        </motion.span>
      </div>

      <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15, duration: 0.35 }}>
        <p className="text-[19px] font-bold leading-snug">
          {tx(lang, channel === "whatsapp" ? "redirectWhatsApp" : "redirectSms")}
          <span className="inline-flex w-6 justify-start" aria-hidden>
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              >
                .
              </motion.span>
            ))}
          </span>
        </p>
        <p className="mt-1.5 text-[13px] text-white/80">{tx(lang, "redirectSub")}</p>
      </motion.div>

      {/* Progress bar */}
      <div className="h-1 w-40 overflow-hidden rounded-full bg-white/25" aria-hidden>
        <motion.div
          className={`h-full origin-left rounded-full ${theme.bar}`}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: REDIRECT_MS / 1000 - 0.1, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
}
