"use client";

import { MessageCircle, MessageSquareText } from "lucide-react";
import type { DeliveryStatus, MessageLog } from "@/types";
import { BLOCK_BY_ID } from "@/data/blocks";
import { fmtDateTime, translate } from "@/lib/i18n";
import { TR } from "@/lib/ui";
import { Table, TableFrame, Td, Th, THead } from "@/components/ui/Table";
import { StatusTicks } from "./ChatViews";

const STATUS_STYLE: Record<DeliveryStatus, string> = {
  queued: "bg-slate-100 text-slate-700",
  sent: "bg-monsoon-50 text-monsoon-800",
  delivered: "bg-leaf-50 text-leaf-800",
  read: "bg-sky-50 text-sky-800",
  failed: "bg-red-50 text-red-800",
};

const LANG = { en: "English", hi: "हिंदी", mr: "मराठी" } as const;

/** Delivery log with animated status chips. */
export function MessageLogTable({ messages, limit = 20 }: { messages: MessageLog[]; limit?: number }) {
  return (
    <TableFrame>
      <Table caption="Message delivery log" minWidth="760px">
        <THead>
          <tr>
            <Th>Time</Th>
            <Th>Channel</Th>
            <Th>Blocks</Th>
            <Th>Advisory</Th>
            <Th>Lang</Th>
            <Th numeric>Recipients</Th>
            <Th>Status</Th>
          </tr>
        </THead>
        <tbody>
          {messages.slice(0, limit).map((m) => (
            <tr key={m.id} className={`${TR} transition hover:bg-slate-50/80`}>
              <Td className="whitespace-nowrap text-muted">{fmtDateTime("en", m.timestamp)}</Td>
              <Td>
                <span className="inline-flex items-center gap-1.5 font-medium text-ink">
                  {m.channel === "whatsapp" ? (
                    <MessageCircle className="h-4 w-4 text-green-600" aria-hidden />
                  ) : (
                    <MessageSquareText className="h-4 w-4 text-monsoon-600" aria-hidden />
                  )}
                  {m.channel === "whatsapp" ? "WhatsApp" : "SMS"}
                </span>
              </Td>
              <Td className="max-w-48 truncate" title={m.blockIds.map((id) => BLOCK_BY_ID[id]?.name).join(", ")}>
                {m.blockIds.map((id) => BLOCK_BY_ID[id]?.name).join(", ")}
              </Td>
              <Td>
                {translate("en", `type.${m.advisoryType}`)} · {translate("en", `crop.${m.crop}`)}
              </Td>
              <Td>{LANG[m.lang]}</Td>
              <Td numeric>{m.recipients.toLocaleString("en-IN")}</Td>
              <Td>
                <span
                  key={m.status}
                  className={`inline-flex animate-pop items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold capitalize ${STATUS_STYLE[m.status]}`}
                >
                  <StatusTicks status={m.status} className="h-3 w-3" /> {m.status}
                </span>
              </Td>
            </tr>
          ))}
          {messages.length === 0 && (
            <tr>
              <td colSpan={7} className="px-3 py-10 text-center text-[13px] text-muted">
                No messages yet.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </TableFrame>
  );
}
