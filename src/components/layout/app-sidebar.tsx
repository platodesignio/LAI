"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { useState } from "react";

interface NavItem {
  href: string;
  label: string;
}

const navItems: NavItem[] = [
  { href: "/chat", label: "Chat" },
  { href: "/sessions", label: "Sessions" },
  { href: "/notes", label: "Notes" },
];

const secondaryItems: NavItem[] = [
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/auth/login");
    }
  }

  return (
    <aside className="w-48 shrink-0 border-r border-gray-200 flex flex-col py-6">
      <div className="px-4 mb-6">
        <Link href="/" className="text-xs font-semibold uppercase tracking-widest">
          Laozi
        </Link>
      </div>

      <nav className="flex-1 px-2">
        <ul className="space-y-0.5">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={clsx(
                  "block px-3 py-2 text-sm transition-colors",
                  pathname === item.href || pathname.startsWith(item.href + "/")
                    ? "bg-black text-white"
                    : "text-gray-600 hover:text-black hover:bg-gray-50"
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <ul className="space-y-0.5">
            {secondaryItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={clsx(
                    "block px-3 py-2 text-sm transition-colors",
                    pathname === item.href
                      ? "bg-black text-white"
                      : "text-gray-500 hover:text-black hover:bg-gray-50"
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="px-2 mt-auto">
        <button
          onClick={() => void handleSignOut()}
          disabled={signingOut}
          className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-black hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </aside>
  );
}
