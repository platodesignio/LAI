import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { AdminSidebar } from "@/components/layout/admin-sidebar";

export const metadata: Metadata = {
  title: {
    template: "%s — Admin",
    default: "Admin",
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect("/auth/login");
  }

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      <AdminSidebar />
      <main className="flex-1 overflow-auto bg-gray-950 text-white">
        {children}
      </main>
    </div>
  );
}
