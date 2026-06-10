"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, Target, Settings, type LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/expenses", label: "Dépenses", icon: Receipt },
  { href: "/budgets", label: "Budgets", icon: Target },
  { href: "/settings", label: "Réglages", icon: Settings },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className={`tap flex flex-col items-center gap-1 ${active ? "text-accent" : "text-text-secondary"}`}
    >
      <Icon size={22} strokeWidth={1.7} />
      {active ? <span className="text-[11px] font-medium">{item.label}</span> : null}
    </Link>
  );
}

export function AppNav() {
  const pathname = usePathname();
  return (
    <>
      <nav
        aria-label="Navigation principale"
        className="fixed left-0 top-0 z-40 hidden h-screen w-20 flex-col items-center gap-6 border-r border-line bg-surface py-8 lg:flex"
      >
        {ITEMS.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}
      </nav>
      <nav
        aria-label="Navigation principale (mobile)"
        className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-line bg-surface py-3 lg:hidden"
      >
        {ITEMS.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}
      </nav>
    </>
  );
}
