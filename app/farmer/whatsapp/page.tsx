"use client";

import { ChannelChat } from "@/components/farmer/ChannelChat";

/** The farmer's advisory as a WhatsApp chat, full screen (no app bars). */
export default function FarmerWhatsAppPage() {
  return <ChannelChat channel="whatsapp" />;
}
