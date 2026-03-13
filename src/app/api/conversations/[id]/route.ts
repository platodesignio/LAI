import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { updateConversationSchema } from "@/lib/validation/chat";
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

    const conversation = await db.conversation.findUnique({
      where: { id, userId: session.user.id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            role: true,
            content: true,
            executionId: true,
            modelProvider: true,
            modelName: true,
            createdAt: true,
          },
        },
      },
    });

    if (!conversation) {
      return apiError("Conversation not found.", 404);
    }

    return apiSuccess({ conversation });
  } catch (err) {
    console.error("[conversations/[id] GET]", err);
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

    const existing = await db.conversation.findUnique({
      where: { id, userId: session.user.id },
      select: { id: true },
    });

    if (!existing) {
      return apiError("Conversation not found.", 404);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("Invalid JSON body.", 400);
    }

    const parsed = updateConversationSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed.", 400, {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { title, archived } = parsed.data;

    const updated = await db.conversation.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(archived !== undefined ? { archived } : {}),
      },
      select: {
        id: true,
        title: true,
        mode: true,
        archived: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return apiSuccess({ conversation: updated });
  } catch (err) {
    console.error("[conversations/[id] PATCH]", err);
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

    const existing = await db.conversation.findUnique({
      where: { id, userId: session.user.id },
      select: { id: true },
    });

    if (!existing) {
      return apiError("Conversation not found.", 404);
    }

    await db.conversation.delete({ where: { id } });

    return apiSuccess({ message: "Conversation deleted." });
  } catch (err) {
    console.error("[conversations/[id] DELETE]", err);
    return apiError("An unexpected error occurred.", 500);
  }
}
