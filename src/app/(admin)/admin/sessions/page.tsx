import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { RevokeAdminSessionButton } from "./revoke-admin-session-button";

export const metadata: Metadata = {
  title: "Sessions",
};

export default async function AdminSessionsPage() {
  await requireAdmin();

  const sessions = await db.userSession.findMany({
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const now = new Date();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-white mb-6">Sessions</h1>

      <div className="border border-gray-700 rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 border-b border-gray-700">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-400">
                User
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-400">
                IP Address
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-400">
                User Agent
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-400">
                Created
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-400">
                Expires
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-400">
                Status
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {sessions.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-gray-500 text-sm"
                >
                  No sessions found.
                </td>
              </tr>
            )}
            {sessions.map((s) => {
              const expired = s.expiresAt < now;
              return (
                <tr
                  key={s.id}
                  className="hover:bg-gray-800 transition-colors"
                >
                  <td className="px-4 py-3 text-gray-300 text-xs">
                    {s.user.email}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">
                    {s.ipAddress ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs max-w-[200px] truncate">
                    {s.userAgent ? s.userAgent.slice(0, 60) + (s.userAgent.length > 60 ? "…" : "") : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {s.createdAt.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {s.expiresAt.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={[
                        "text-xs px-2 py-0.5 rounded font-medium",
                        expired
                          ? "bg-gray-800 text-gray-500"
                          : "bg-green-900 text-green-400",
                      ].join(" ")}
                    >
                      {expired ? "Expired" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!expired && <RevokeAdminSessionButton sessionId={s.id} />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
