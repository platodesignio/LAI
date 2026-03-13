import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { AppSidebar } from "@/components/layout/app-sidebar";

export const metadata: Metadata = {
  title: {
    template: "%s — Laozi",
    default: "Laozi",
  },
};

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireSession();
  } catch {
    redirect("/auth/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
