"use client";

import { ChannelChat } from "@/components/farmer/ChannelChat";

/**
 * The farmer's advisory as plain SMS messages, full screen (no app bars):
 * what a feature phone would receive. Reply 1 / 2 / 3 to change language.
 */
export default function SmsViewPage() {
  return <ChannelChat channel="sms" />;
}
