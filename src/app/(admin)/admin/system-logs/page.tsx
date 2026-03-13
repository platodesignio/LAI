import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "System Logs",
};

interface PageProps {
  searchParams: Promise<{ action?: string }>;
}

export default async function AdminSystemLogsPage({
  searchParams,
}: PageProps) {
  await requireAdmin();

  const resolvedParams = await searchParams;
  const actionFilter = resolvedParams.action?.trim() ?? "";

  const whereClause = actionFilter
    ? { action: { contains: actionFilter, mode: "insensitive" as const } }
    : {};

  const logs = await db.auditLog.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Collect distinct actions for filter suggestions
  const distinctActions = await db.auditLog.findMany({
    distinct: ["action"],
    select: { action: true },
    orderBy: { action: "asc" },
    take: 50,
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-white mb-6">System Logs</h1>

      {/* Filter */}
      <div className="flex items-start gap-6 mb-6">
        <form method="GET" action="/admin/system-logs" className="flex items-center gap-3">
          <input
            name="action"
            defaultValue={actionFilter}
            placeholder="Filter by action…"
            className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-1 focus:ring-offset-gray-950 w-56"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-white text-black text-sm rounded hover:bg-gray-200 transition-colors"
          >
            Filter
          </button>
          {actionFilter && (
            <Link
              href="/admin/system-logs"
              className="text-xs text-gray-400 hover:text-white underline"
            >
              Clear
            </Link>
          )}
        </form>

        {distinctActions.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500">Quick filter:</span>
            {distinctActions.slice(0, 8).map(({ action }) => (
              <Link
                key={action}
                href={`/admin/system-logs?action=${encodeURIComponent(action)}`}
                className={[
                  "text-xs px-2 py-0.5 rounded border transition-colors",
                  action === actionFilter
                    ? "border-white text-white bg-white/10"
                    : "border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white",
                ].join(" ")}
              >
                {action}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="border border-gray-700 rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 border-b border-gray-700">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-400">
                User ID
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-400">
                Action
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-400">
                Resource
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-400">
                Resource ID
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-400">
                IP Address
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-400">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {logs.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-gray-500 text-sm"
                >
                  {actionFilter
                    ? `No logs matching action "${actionFilter}"`
                    : "No audit logs found."}
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr
                key={log.id}
                className="hover:bg-gray-800 transition-colors"
              >
                <td className="px-4 py-3 font-mono text-xs text-gray-500">
                  {log.userId ? log.userId.slice(0, 8) + "…" : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-mono text-white bg-gray-800 px-2 py-0.5 rounded">
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {log.resource ?? "—"}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">
                  {log.resourceId
                    ? log.resourceId.slice(0, 12) + (log.resourceId.length > 12 ? "…" : "")
                    : "—"}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">
                  {log.ipAddress ?? "—"}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {log.createdAt.toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-600 mt-3">
        Showing most recent {logs.length} of up to 100 entries.
        {actionFilter && ` Filtered by action: "${actionFilter}"`}
      </p>
    </div>
  );
}
