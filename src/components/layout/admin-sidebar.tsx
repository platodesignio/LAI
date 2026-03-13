"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

interface AdminNavItem {
  href: string;
  label: string;
}

const adminNavItems: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/sessions", label: "Sessions" },
  { href: "/admin/feedback", label: "Feedback" },
  { href: "/admin/incidents", label: "Incidents" },
  { href: "/admin/prompt-policies", label: "Prompt Policies" },
  { href: "/admin/feature-flags", label: "Feature Flags" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/system-logs", label: "System Logs" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-52 shrink-0 bg-gray-950 flex flex-col py-6 min-h-screen">
      <div className="px-4 mb-8">
        <span className="text-xs font-semibold uppercase tracking-widest text-white">
          Laozi
        </span>
        <span className="block text-xs text-gray-500 mt-0.5 uppercase tracking-wider">
          Admin
        </span>
      </div>

      <nav className="flex-1 px-2">
        <ul className="space-y-0.5">
          {adminNavItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={clsx(
                    "block px-3 py-2 text-xs transition-colors",
                    isActive
                      ? "bg-white text-black"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-2 mt-4 border-t border-gray-800 pt-4">
        <Link
          href="/chat"
          className="block px-3 py-2 text-xs text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
        >
          ← User view
        </Link>
      </div>
    </aside>
  );
}
