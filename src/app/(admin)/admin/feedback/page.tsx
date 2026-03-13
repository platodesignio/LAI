import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { FeedbackActionButtons } from "./feedback-action-buttons";

export const metadata: Metadata = {
  title: "Feedback",
};

interface PageProps {
  searchParams: Promise<{ flagged?: string; unreviewed?: string; page?: string }>;
}

export default async function AdminFeedbackPage({ searchParams }: PageProps) {
  await requireAdmin();

  const resolvedParams = await searchParams;
  const showFlagged = resolvedParams.flagged === "true";
  const showUnreviewed = resolvedParams.unreviewed === "true";
  const page = Math.max(1, parseInt(resolvedParams.page ?? "1", 10));
  const pageSize = 25;
  const skip = (page - 1) * pageSize;

  const whereClause: Record<string, unknown> = {};
  if (showFlagged) whereClause.flagged = true;
  if (showUnreviewed) whereClause.reviewed = false;

  const [feedbackItems, total] = await Promise.all([
    db.feedback.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, email: true, name: true } },
        message: { select: { id: true, content: true } },
        conversation: { select: { id: true, mode: true } },
      },
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip,
    }),
    db.feedback.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  function buildFilterUrl(params: {
    flagged?: boolean;
    unreviewed?: boolean;
  }) {
    const p = new URLSearchParams();
    if (params.flagged) p.set("flagged", "true");
    if (params.unreviewed) p.set("unreviewed", "true");
    const qs = p.toString();
    return `/admin/feedback${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-white mb-6">Feedback</h1>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/feedback"
          className={[
            "text-xs px-3 py-1 rounded border transition-colors",
            !showFlagged && !showUnreviewed
              ? "border-white text-white bg-white/10"
              : "border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white",
          ].join(" ")}
        >
          All
        </Link>
        <Link
          href={buildFilterUrl({ flagged: true })}
          className={[
            "text-xs px-3 py-1 rounded border transition-colors",
            showFlagged && !showUnreviewed
              ? "border-white text-white bg-white/10"
              : "border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white",
          ].join(" ")}
        >
          Flagged
        </Link>
        <Link
          href={buildFilterUrl({ unreviewed: true })}
          className={[
            "text-xs px-3 py-1 rounded border transition-colors",
            showUnreviewed && !showFlagged
              ? "border-white text-white bg-white/10"
              : "border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white",
          ].join(" ")}
        >
          Unreviewed
        </Link>
      </div>

      <div className="border border-gray-700 rounded overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 border-b border-gray-700">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-400">
                Execution ID
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-400">
                Rating
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-400">
                Comment
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-400">
                Flagged
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-400">
                Reviewed
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-400">
                User
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-400">
                Date
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {feedbackItems.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-gray-500 text-sm"
                >
                  No feedback found.
                </td>
              </tr>
            )}
            {feedbackItems.map((fb) => (
              <tr
                key={fb.id}
                className="hover:bg-gray-800 transition-colors"
              >
                <td className="px-4 py-3 font-mono text-xs text-gray-400">
                  {fb.executionId
                    ? fb.executionId.slice(0, 10) + "…"
                    : "—"}
                </td>
                <td className="px-4 py-3 text-gray-300 text-xs">
                  {fb.rating !== null && fb.rating !== undefined
                    ? fb.rating
                    : "—"}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs max-w-[180px] truncate">
                  {fb.comment ? fb.comment.slice(0, 80) + (fb.comment.length > 80 ? "…" : "") : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={[
                      "text-xs px-2 py-0.5 rounded",
                      fb.flagged
                        ? "bg-yellow-900 text-yellow-300"
                        : "text-gray-600",
                    ].join(" ")}
                  >
                    {fb.flagged ? "Flagged" : "—"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={[
                      "text-xs px-2 py-0.5 rounded",
                      fb.reviewed
                        ? "bg-green-900 text-green-300"
                        : "bg-gray-800 text-gray-500",
                    ].join(" ")}
                  >
                    {fb.reviewed ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-300 text-xs max-w-[140px] truncate">
                  {fb.user?.email ?? "—"}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {fb.createdAt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3 text-right">
                  <FeedbackActionButtons
                    feedbackId={fb.id}
                    reviewed={fb.reviewed}
                    flagged={fb.flagged}
                  />
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
                href={`/admin/feedback?page=${page - 1}${showFlagged ? "&flagged=true" : ""}${showUnreviewed ? "&unreviewed=true" : ""}`}
                className="text-sm px-3 py-1 border border-gray-700 rounded hover:bg-gray-800 text-gray-300"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/feedback?page=${page + 1}${showFlagged ? "&flagged=true" : ""}${showUnreviewed ? "&unreviewed=true" : ""}`}
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
