import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { StatCard } from "@/components/admin/stat-card";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function AdminDashboardPage() {
  await requireAdmin();

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    userCount,
    conversationsLast7Days,
    flaggedFeedbackCount,
    unreviewedFeedbackCount,
    unresolvedIncidentCount,
    messagesToday,
    recentIncidents,
    flaggedFeedback,
  ] = await Promise.all([
    db.user.count(),
    db.conversation.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    }),
    db.feedback.count({ where: { flagged: true } }),
    db.feedback.count({ where: { reviewed: false } }),
    db.incident.count({ where: { resolved: false } }),
    db.message.count({ where: { createdAt: { gte: todayStart } } }),
    db.incident.findMany({
      where: { resolved: false },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.feedback.findMany({
      where: { flagged: true, reviewed: false },
      include: {
        user: { select: { id: true, email: true, name: true } },
        message: { select: { id: true, content: true } },
        conversation: { select: { id: true, mode: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-white mb-8">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 mb-10 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total users" value={userCount} />
        <StatCard label="Conversations (7d)" value={conversationsLast7Days} />
        <StatCard label="Messages today" value={messagesToday} />
        <StatCard label="Flagged feedback" value={flaggedFeedbackCount} />
        <StatCard label="Unreviewed feedback" value={unreviewedFeedbackCount} />
        <StatCard
          label="Unresolved incidents"
          value={unresolvedIncidentCount}
          highlight={unresolvedIncidentCount > 0}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Recent unresolved incidents */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
              Unresolved incidents
            </h2>
            <Link
              href="/admin/incidents"
              className="text-xs text-gray-400 hover:text-white"
            >
              View all →
            </Link>
          </div>
          {recentIncidents.length === 0 ? (
            <p className="text-sm text-gray-500">No unresolved incidents.</p>
          ) : (
            <div className="border border-gray-700 rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-900 border-b border-gray-700">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-400">
                      Type
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-400">
                      Severity
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-400">
                      Description
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-400">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {recentIncidents.map((incident) => (
                    <tr
                      key={incident.id}
                      className="hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-300 text-xs font-mono">
                        {incident.type}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={[
                            "text-xs px-2 py-0.5 rounded font-medium",
                            incident.severity === "CRITICAL"
                              ? "bg-red-900 text-red-300"
                              : incident.severity === "HIGH"
                              ? "bg-orange-900 text-orange-300"
                              : incident.severity === "MEDIUM"
                              ? "bg-yellow-900 text-yellow-300"
                              : "bg-gray-800 text-gray-400",
                          ].join(" ")}
                        >
                          {incident.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-xs max-w-xs truncate">
                        {incident.description}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {incident.createdAt.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Flagged feedback */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
              Flagged feedback
            </h2>
            <Link
              href="/admin/feedback"
              className="text-xs text-gray-400 hover:text-white"
            >
              View all →
            </Link>
          </div>
          {flaggedFeedback.length === 0 ? (
            <p className="text-sm text-gray-500">No flagged feedback.</p>
          ) : (
            <div className="border border-gray-700 rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-900 border-b border-gray-700">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-400">
                      User
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-400">
                      Rating
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-400">
                      Comment
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-400">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {flaggedFeedback.map((fb) => (
                    <tr
                      key={fb.id}
                      className="hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-300 text-xs truncate max-w-[120px]">
                        {fb.user?.email ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-xs">
                        {fb.rating ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs max-w-[160px] truncate">
                        {fb.comment ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {fb.createdAt.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
