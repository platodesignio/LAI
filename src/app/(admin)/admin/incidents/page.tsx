import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ResolveButton } from "./resolve-button";

export const metadata: Metadata = {
  title: "Incidents",
};

interface PageProps {
  searchParams: Promise<{ unresolved?: string; page?: string }>;
}

export default async function AdminIncidentsPage({
  searchParams,
}: PageProps) {
  await requireAdmin();

  const resolvedParams = await searchParams;
  const showOnlyUnresolved = resolvedParams.unresolved !== "false";
  const page = Math.max(1, parseInt(resolvedParams.page ?? "1", 10));
  const pageSize = 25;
  const skip = (page - 1) * pageSize;

  const whereClause = showOnlyUnresolved ? { resolved: false } : {};

  const [incidents, total] = await Promise.all([
    db.incident.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip,
    }),
    db.incident.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  function severityStyle(severity: string) {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-900 text-red-300";
      case "HIGH":
        return "bg-orange-900 text-orange-300";
      case "MEDIUM":
        return "bg-yellow-900 text-yellow-300";
      default:
        return "bg-gray-800 text-gray-400";
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-white mb-6">Incidents</h1>

      {/* Filter toggle */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/incidents"
          className={[
            "text-xs px-3 py-1 rounded border transition-colors",
            showOnlyUnresolved
              ? "border-white text-white bg-white/10"
              : "border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white",
          ].join(" ")}
        >
          Unresolved
        </Link>
        <Link
          href="/admin/incidents?unresolved=false"
          className={[
            "text-xs px-3 py-1 rounded border transition-colors",
            !showOnlyUnresolved
              ? "border-white text-white bg-white/10"
              : "border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white",
          ].join(" ")}
        >
          All incidents
        </Link>
      </div>

      <div className="border border-gray-700 rounded overflow-hidden mb-6">
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
                User ID
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-400">
                Execution ID
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-400">
                Resolved
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-400">
                Date
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {incidents.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-gray-500 text-sm"
                >
                  No incidents found.
                </td>
              </tr>
            )}
            {incidents.map((incident) => (
              <tr
                key={incident.id}
                className="hover:bg-gray-800 transition-colors"
              >
                <td className="px-4 py-3 font-mono text-xs text-gray-400">
                  {incident.type}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={[
                      "text-xs px-2 py-0.5 rounded font-medium",
                      severityStyle(incident.severity),
                    ].join(" ")}
                  >
                    {incident.severity}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-300 text-xs max-w-[220px] truncate">
                  {incident.description}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">
                  {incident.userId ? incident.userId.slice(0, 8) + "…" : "—"}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">
                  {incident.executionId
                    ? incident.executionId.slice(0, 10) + "…"
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={[
                      "text-xs px-2 py-0.5 rounded",
                      incident.resolved
                        ? "bg-green-900 text-green-300"
                        : "bg-red-900 text-red-300",
                    ].join(" ")}
                  >
                    {incident.resolved ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {incident.createdAt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3 text-right">
                  {!incident.resolved && (
                    <ResolveButton incidentId={incident.id} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {skip + 1}–{Math.min(skip + pageSize, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={`/admin/incidents?page=${page - 1}${!showOnlyUnresolved ? "&unresolved=false" : ""}`}
                className="text-sm px-3 py-1 border border-gray-700 rounded hover:bg-gray-800 text-gray-300"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/incidents?page=${page + 1}${!showOnlyUnresolved ? "&unresolved=false" : ""}`}
                className="text-sm px-3 py-1 border border-gray-700 rounded hover:bg-gray-800 text-gray-300"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
