"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LayoutDashboard, Receipt, Target, Settings, type LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  labelKey: "dashboard" | "expenses" | "budgets" | "settings";
  icon: LucideIcon;
}

const ITEMS: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/expenses", labelKey: "expenses", icon: Receipt },
  { href: "/budgets", labelKey: "budgets", icon: Target },
  { href: "/settings", labelKey: "settings", icon: Settings },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const t = useTranslations("nav");
  const Icon = item.icon;
  const label = t(item.labelKey);
  return (
    <Link
      href={item.href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={`tap flex flex-col items-center gap-1 ${active ? "text-accent" : "text-text-secondary"}`}
    >
      <Icon size={22} strokeWidth={1.7} />
      {active ? <span className="text-[11px] font-medium">{label}</span> : null}
    </Link>
  );
}

export function AppNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  return (
    <>
      <nav
        aria-label={t("ariaMain")}
        className="fixed left-0 top-0 z-40 hidden h-screen w-20 flex-col items-center gap-6 border-r border-line bg-surface py-8 lg:flex"
      >
        {ITEMS.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}
      </nav>
      <nav
        aria-label={t("ariaMainMobile")}
        className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-line bg-surface pt-3 pb-[calc(0.75rem_+_env(safe-area-inset-bottom))] lg:hidden"
      >
        {ITEMS.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}
      </nav>
    </>
  );
}
