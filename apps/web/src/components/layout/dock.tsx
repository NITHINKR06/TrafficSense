"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface DockItem {
  key: string;
  label: string;
  href: string;
  isCentre?: boolean;
  match: (pathname: string) => boolean;
  icon: ReactNode;
}

const HomeIcon = (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
  </svg>
);

const MapIcon = (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 4 3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5zM9 4v13.5M15 6.5V20" />
  </svg>
);

const PlusIcon = (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const RouteIcon = (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 16a3 3 0 1 0 0 6 3 3 0 1 0 0-6M18 2a3 3 0 1 0 0 6 3 3 0 1 0 0-6M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
  </svg>
);

const UserIcon = (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 4a4 4 0 1 0 0 8 4 4 0 1 0 0-8M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
  </svg>
);

const BuildingIcon = (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9v.01M9 13v.01M9 17v.01" />
  </svg>
);

const ShieldIcon = (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3 4 7v5c0 5 3.5 8.5 8 9.5 4.5-1 8-4.5 8-9.5V7z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const ChartIcon = (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </svg>
);

const ListIcon = (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
  </svg>
);

const CONSUMER_TABS: DockItem[] = [
  { key: "home", label: "Home", href: "/", match: (p) => p === "/", icon: HomeIcon },
  { key: "live", label: "Live", href: "/traffic", match: (p) => p.startsWith("/traffic"), icon: MapIcon },
  {
    key: "report",
    label: "Report",
    href: "/report",
    isCentre: true,
    match: (p) => p.startsWith("/report"),
    icon: PlusIcon,
  },
  { key: "plan", label: "Plan", href: "/planner", match: (p) => p.startsWith("/planner"), icon: RouteIcon },
  { key: "you", label: "You", href: "/workspace", match: (p) => p.startsWith("/workspace"), icon: UserIcon },
];

const EMPLOYER_TABS: DockItem[] = [
  { key: "home", label: "Home", href: "/", match: (p) => p === "/", icon: HomeIcon },
  { key: "orgs", label: "Orgs", href: "/employer", match: (p) => p.startsWith("/employer"), icon: BuildingIcon },
  { key: "live", label: "Live", href: "/traffic", match: (p) => p.startsWith("/traffic"), icon: MapIcon },
  { key: "you", label: "You", href: "/workspace", match: (p) => p.startsWith("/workspace"), icon: UserIcon },
];

const AUTHORITY_TABS: DockItem[] = [
  { key: "overview", label: "Overview", href: "/authority", match: (p) => p === "/authority", icon: HomeIcon },
  { key: "hotspots", label: "Hotspots", href: "/authority?tab=map", match: () => false, icon: MapIcon },
  {
    key: "review",
    label: "Review",
    href: "/authority?tab=review",
    isCentre: true,
    match: () => false,
    icon: ShieldIcon,
  },
  { key: "insights", label: "Insights", href: "/authority?tab=diagnostics", match: () => false, icon: ChartIcon },
  { key: "log", label: "Log", href: "/authority?tab=history", match: () => false, icon: ListIcon },
];

const ADMIN_TABS: DockItem[] = [
  { key: "overview", label: "Overview", href: "/admin", match: (p) => p === "/admin", icon: HomeIcon },
  { key: "queue", label: "Queue", href: "/authority", match: (p) => p.startsWith("/authority"), icon: ShieldIcon },
  { key: "roles", label: "Live", href: "/traffic", match: (p) => p.startsWith("/traffic"), icon: MapIcon },
  { key: "audit", label: "You", href: "/workspace", match: (p) => p.startsWith("/workspace"), icon: UserIcon },
];

export function Dock({ role }: { role: string | null }) {
  const pathname = usePathname();
  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  const tabs =
    role === "authority" && pathname.startsWith("/authority")
      ? AUTHORITY_TABS
      : role === "employer"
      ? EMPLOYER_TABS
      : role === "admin"
      ? ADMIN_TABS
      : CONSUMER_TABS;

  return (
    <div className="ts-dock-wrap">
      <nav aria-label="Primary" className="ts-dock">
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          if (tab.isCentre) {
            return (
              <Link
                key={tab.key}
                href={tab.href}
                aria-label={tab.label}
                title={tab.label}
                className="ts-dock-centre"
              >
                {tab.icon}
              </Link>
            );
          }
          return (
            <Link
              key={tab.key}
              href={tab.href}
              prefetch={tab.href === "/workspace" || tab.href === "/employer" || tab.href === "/authority" || tab.href === "/admin" ? false : undefined}
              aria-label={tab.label}
              aria-current={active ? "page" : undefined}
              className={`ts-dock-tab ${active ? "ts-dock-tab--active" : ""}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
