import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getModeDisplayName } from "@/lib/ai/modes";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { ArchiveButton } from "./archive-button";

export const metadata: Metadata = {
  title: "Sessions",
};

interface PageProps {
  searchParams: Promise<{ page?: string; archived?: string }>;
}

export default async function SessionsPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const session = await requireSession();
  const userId = session.user.id;

  const page = Math.max(1, parseInt(resolvedParams.page ?? "1", 10));
  const showArchived = resolvedParams.archived === "true";
  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  const [conversations, total] = await Promise.all([
    db.conversation.findMany({
      where: { userId, archived: showArchived },
      include: { _count: { select: { messages: true } } },
      orderBy: { updatedAt: "desc" },
      take: pageSize,
      skip,
    }),
    db.conversation.count({
      where: { userId, archived: showArchived },
    }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-black">Sessions</h1>
        <div className="flex items-center gap-3">
          <Link
            href={showArchived ? "/sessions" : "/sessions?archived=true"}
            className="text-sm text-gray-500 hover:text-black underline underline-offset-2"
          >
            {showArchived ? "Active sessions" : "Archived sessions"}
          </Link>
          <Link
            href="/chat"
            className="text-sm bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors"
          >
            New conversation
          </Link>
        </div>
      </div>

      {conversations.length === 0 ? (
        <EmptyState
          title={showArchived ? "No archived sessions" : "No sessions yet"}
          description={
            showArchived
              ? "Archived conversations will appear here."
              : "Start a new conversation to get going."
          }
        />
      ) : (
        <>
          <div className="border border-gray-200 rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Title
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Mode
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Messages
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Created
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {conversations.map((conv) => (
                  <tr key={conv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/chat/${conv.id}`}
                        className="text-black hover:underline font-medium truncate max-w-xs block"
                      >
                        {conv.title ?? "Untitled conversation"}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">
                        {getModeDisplayName(conv.mode)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {conv._count.messages}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {conv.createdAt.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!showArchived && (
                        <ArchiveButton conversationId={conv.id} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-500">
                Showing {skip + 1}–{Math.min(skip + pageSize, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                {page > 1 && (
                  <Link
                    href={`/sessions?page=${page - 1}${showArchived ? "&archived=true" : ""}`}
                    className="text-sm px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Previous
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={`/sessions?page=${page + 1}${showArchived ? "&archived=true" : ""}`}
                    className="text-sm px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
