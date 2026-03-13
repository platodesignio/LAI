import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";

export const metadata: Metadata = {
  title: "Notes",
};

export default async function NotesPage() {
  const session = await requireSession();
  const userId = session.user.id;

  const notes = await db.savedNote.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-black">Notes</h1>
        <Link
          href="/notes/new"
          className="text-sm bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors"
        >
          New note
        </Link>
      </div>

      {notes.length === 0 ? (
        <EmptyState
          title="No notes yet"
          description="Save insights from your conversations or create standalone notes."
        />
      ) : (
        <div className="border border-gray-200 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Title
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Type
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {notes.map((note) => (
                <tr key={note.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/notes/${note.id}`}
                      className="text-black hover:underline font-medium"
                    >
                      {note.title ?? "Untitled note"}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs">
                      {note.noteType ?? "General"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {note.createdAt.toLocaleDateString("en-US", {
                      year: "numeric",
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
    </div>
  );
}
