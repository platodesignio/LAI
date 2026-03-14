import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { updateNoteSchema } from "@/lib/validation/notes";
import { apiError, apiSuccess } from "@/lib/utils/request";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    let session;
    try {
      session = await requireSession();
    } catch {
      return apiError("Not authenticated.", 401);
    }

    const { id } = await params;

    const note = await db.savedNote.findUnique({
      where: { id, userId: session.user.id },
      select: {
        id: true,
        title: true,
        content: true,
        noteType: true,
        conversationId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!note) {
      return apiError("Note not found.", 404);
    }

    return apiSuccess({ note });
  } catch (err) {
    console.error("[notes/[id] GET]", err);
    return apiError("An unexpected error occurred.", 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    let session;
    try {
      session = await requireSession();
    } catch {
      return apiError("Not authenticated.", 401);
    }

    const { id } = await params;

    const existing = await db.savedNote.findUnique({
      where: { id, userId: session.user.id },
      select: { id: true },
    });

    if (!existing) {
      return apiError("Note not found.", 404);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("Invalid JSON body.", 400);
    }

    const parsed = updateNoteSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed.", 400, {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { title, content, noteType } = parsed.data;

    const updated = await db.savedNote.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(content !== undefined ? { content } : {}),
        ...(noteType !== undefined ? { noteType } : {}),
      },
      select: {
        id: true,
        title: true,
        content: true,
        noteType: true,
        conversationId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return apiSuccess({ note: updated });
  } catch (err) {
    console.error("[notes/[id] PATCH]", err);
    return apiError("An unexpected error occurred.", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    let session;
    try {
      session = await requireSession();
    } catch {
      return apiError("Not authenticated.", 401);
    }

    const { id } = await params;

    const existing = await db.savedNote.findUnique({
      where: { id, userId: session.user.id },
      select: { id: true },
    });

    if (!existing) {
      return apiError("Note not found.", 404);
    }

    await db.savedNote.delete({ where: { id } });

    return apiSuccess({ message: "Note deleted." });
  } catch (err) {
    console.error("[notes/[id] DELETE]", err);
    return apiError("An unexpected error occurred.", 500);
  }
}
