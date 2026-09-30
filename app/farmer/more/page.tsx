"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  ChevronRight,
  FlaskConical,
  Globe,
  History,
  LogOut,
  Menu,
  MessageCircle,
  MessageSquareText,
  RotateCcw,
  Sprout,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useT } from "@/hooks/useT";
import { Card, PageTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import type { TKey } from "@/lib/i18n";

const ITEMS: { href: string; key: TKey; icon: typeof Bell }[] = [
  { href: "/farmer/crops", key: "nav.crops", icon: Sprout },
  { href: "/farmer/alerts", key: "nav.alerts", icon: Bell },
  { href: "/farmer/sms", key: "nav.sms", icon: MessageSquareText },
  { href: "/gateway", key: "nav.gateway", icon: MessageCircle },
  { href: "/drivers", key: "nav.drivers", icon: Globe },
  { href: "/simulator", key: "nav.simulator", icon: FlaskConical },
  { href: "/replay", key: "nav.replay", icon: History },
  { href: "/methodology", key: "nav.methodology", icon: BookOpen },
];

export default function MorePage() {
  const { t } = useT();
  const router = useRouter();
  const logout = useAppStore((s) => s.logout);
  const resetDemo = useAppStore((s) => s.resetDemo);

  return (
    <div className="space-y-4">
      <PageTitle icon={Menu} title={t("nav.more")} />
      <Card pad>
        <p className="mb-2 text-[13px] font-semibold text-ink">{t("lang.label")}</p>
        <LanguageSwitcher />
      </Card>
      <Card className="overflow-hidden" as="div">
        <ul>
          {ITEMS.map(({ href, key, icon: Icon }) => (
            <li key={href} className="border-b border-line last:border-0">
              <Link href={href} className="flex min-h-14 items-center gap-3 px-4 text-[14.5px] font-semibold text-ink transition hover:bg-leaf-50/50">
                <Icon className="h-5 w-5 shrink-0 text-leaf-600" aria-hidden />
                <span className="flex-1">{t(key)}</span>
                <ChevronRight className="h-4.5 w-4.5 shrink-0 text-slate-300" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </Card>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="lg" onClick={resetDemo} icon={RotateCcw}>
          Reset demo data
        </Button>
        <Button
          variant="danger"
          size="lg"
          onClick={() => {
            logout();
            router.push("/");
          }}
          icon={LogOut}
        >
          {t("nav.logout")}
        </Button>
      </div>
    </div>
  );
}
