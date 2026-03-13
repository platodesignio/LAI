import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { createConversationSchema } from "@/lib/validation/chat";
import { apiError, apiSuccess } from "@/lib/utils/request";

export async function GET(_request: NextRequest): Promise<Response> {
  try {
    let session;
    try {
      session = await requireSession();
    } catch {
      return apiError("Not authenticated.", 401);
    }

    const conversations = await db.conversation.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        mode: true,
        archived: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { messages: true },
        },
      },
    });

    return apiSuccess({ conversations });
  } catch (err) {
    console.error("[conversations GET]", err);
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

    const parsed = createConversationSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed.", 400, {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { mode, title } = parsed.data;

    const conversation = await db.conversation.create({
      data: {
        userId: session.user.id,
        mode,
        title: title ?? null,
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

    return apiSuccess({ conversation }, 201);
  } catch (err) {
    console.error("[conversations POST]", err);
    return apiError("An unexpected error occurred.", 500);
  }
}
