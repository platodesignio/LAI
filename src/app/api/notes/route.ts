import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { createNoteSchema } from "@/lib/validation/notes";
import { apiError, apiSuccess } from "@/lib/utils/request";

export async function GET(_request: NextRequest): Promise<Response> {
  try {
    let session;
    try {
      session = await requireSession();
    } catch {
      return apiError("Not authenticated.", 401);
    }

    const notes = await db.savedNote.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        noteType: true,
        conversationId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return apiSuccess({ notes });
  } catch (err) {
    console.error("[notes GET]", err);
    return apiError("An unexpected error occurred.", 500);
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    let session;
    try {
      session = await requireSession();
    } catch {
      return apiError("Not authenticated.", 401);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("Invalid JSON body.", 400);
    }

    const parsed = createNoteSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed.", 400, {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { title, content, noteType, conversationId } = parsed.data;

    // If conversationId is provided, verify it belongs to the user
    if (conversationId) {
      const conversation = await db.conversation.findUnique({
        where: { id: conversationId, userId: session.user.id },
        select: { id: true },
      });
      if (!conversation) {
        return apiError("Conversation not found.", 404);
      }
    }

    const note = await db.savedNote.create({
      data: {
        userId: session.user.id,
        title,
        content,
        noteType,
        conversationId: conversationId ?? null,
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

    return apiSuccess({ note }, 201);
  } catch (err) {
    console.error("[notes POST]", err);
    return apiError("An unexpected error occurred.", 500);
  }
}
