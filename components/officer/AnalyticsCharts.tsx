"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FeedbackEntry, Lang, MessageLog } from "@/types";
import { translate } from "@/lib/i18n";
import { axisProps, CHART, gridProps, legendProps, tooltipProps } from "@/lib/chartTheme";
import { Card, CardHeader } from "@/components/ui/Card";

const LANG_LABEL: Record<Lang, string> = { en: "English", hi: "Hindi", mr: "Marathi" };
const LANG_COLOR: Record<Lang, string> = { mr: CHART.navy, hi: CHART.amber, en: CHART.green };

function weekLabel(iso: string) {
  const d = new Date(iso);
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  return start.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function AnalyticsCharts({ messages, feedback }: { messages: MessageLog[]; feedback: FeedbackEntry[] }) {
  const byType = Object.entries(
    messages.reduce<Record<string, number>>((acc, m) => {
      acc[m.advisoryType] = (acc[m.advisoryType] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .map(([type, count]) => ({ type: translate("en", `type.${type}`), count }))
    .sort((a, b) => b.count - a.count);

  const trendMap = new Map<string, { week: string; useful: number; total: number; ts: number }>();
  for (const f of feedback) {
    const k = weekLabel(f.timestamp);
    const cur = trendMap.get(k) ?? { week: k, useful: 0, total: 0, ts: new Date(f.timestamp).getTime() };
    cur.total += 1;
    if (f.useful) cur.useful += 1;
    cur.ts = Math.min(cur.ts, new Date(f.timestamp).getTime());
    trendMap.set(k, cur);
  }
  // Skip weeks with too few ratings to be meaningful.
  const trend = [...trendMap.values()].filter((w) => w.total >= 4).sort((a, b) => a.ts - b.ts).map((w) => ({ week: w.week, pct: Math.round((w.useful / w.total) * 100), n: w.total }));

  const byLang = (["mr", "hi", "en"] as Lang[]).map((l) => ({
    lang: l,
    name: LANG_LABEL[l],
    value: messages.filter((m) => m.lang === l).reduce((s, m) => s + m.recipients, 0),
  }));

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Card pad>
        <CardHeader title="Advisories by type" subtitle="Campaigns sent (count)" as="h3" />
        <div className="mt-4 h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byType} layout="vertical" margin={{ left: 4, right: 16 }}>
              <CartesianGrid stroke={CHART.grid} strokeDasharray="2 4" horizontal={false} />
              <XAxis type="number" allowDecimals={false} {...axisProps} />
              <YAxis type="category" dataKey="type" width={118} {...axisProps} />
              <Tooltip {...tooltipProps} cursor={{ fill: "rgba(11,29,51,0.03)" }} />
              <Bar dataKey="count" name="Campaigns" fill={CHART.navy} radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card pad>
        <CardHeader title="Farmer feedback trend" subtitle="% of advisories rated useful, by week" as="h3" />
        <div className="mt-4 h-60">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ left: -14, right: 12 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="week" {...axisProps} />
              <YAxis domain={[0, 100]} unit="%" {...axisProps} />
              <Tooltip {...tooltipProps} formatter={(v) => [`${v}%`, "Useful"]} />
              <Line type="monotone" dataKey="pct" name="Useful" stroke={CHART.green} strokeWidth={2.5} dot={{ r: 3, strokeWidth: 0, fill: CHART.green }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card pad>
        <CardHeader title="Language distribution" subtitle="Recipients reached" as="h3" />
        <div className="mt-4 h-60">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={byLang} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={2} stroke="#fff" strokeWidth={2}>
                {byLang.map((d) => (
                  <Cell key={d.lang} fill={LANG_COLOR[d.lang]} />
                ))}
              </Pie>
              <Tooltip {...tooltipProps} formatter={(v) => Number(v).toLocaleString("en-IN")} />
              <Legend {...legendProps} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
