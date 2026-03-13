import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { NoteEditor } from "./note-editor";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ noteId: string }>;
}): Promise<Metadata> {
  const { noteId } = await params;
  const note = await db.savedNote.findUnique({ where: { id: noteId } });
  return { title: note?.title ?? "Note" };
}

interface PageProps {
  params: Promise<{ noteId: string }>;
}

export default async function NoteDetailPage({ params }: PageProps) {
  const { noteId } = await params;
  const session = await requireSession();

  const note = await db.savedNote.findUnique({ where: { id: noteId } });

  if (!note) {
    notFound();
  }

  if (note.userId !== session.user.id) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center px-6 py-12">
          <h1 className="text-xl font-semibold text-black mb-2">
            Access Denied
          </h1>
          <p className="text-gray-500 text-sm">
            You do not have permission to view this note.
          </p>
        </div>
      </div>
    );
  }

  return <NoteEditor note={note} />;
}
