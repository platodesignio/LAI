import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { applyChatRateLimit } from "@/lib/rate-limit/index";
import { createChatStream } from "@/lib/ai/provider";
import { chatRequestSchema } from "@/lib/validation/chat";
import { isRateLimitingEnabled, isChatEnabled } from "@/lib/feature-flags";
import { getClientIp, getRequestId, apiError } from "@/lib/utils/request";

export async function POST(request: NextRequest): Promise<Response> {
  let session;
  try {
    session = await requireSession();
  } catch {
    return apiError("Not authenticated.", 401);
  }

  try {
    const rateLimitingEnabled = await isRateLimitingEnabled();
    if (rateLimitingEnabled) {
      const rateLimit = await applyChatRateLimit(session.user.id);
      if (!rateLimit.allowed) {
        const retryAfter = Math.ceil(
          (rateLimit.resetAt.getTime() - Date.now()) / 1000
        );
        return new Response(
          JSON.stringify({ error: "Too many requests. Please try again later." }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": String(retryAfter),
            },
          }
        );
      }
    }

    const chatEnabled = await isChatEnabled();
    if (!chatEnabled) {
      return apiError("Chat is currently unavailable.", 503);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("Invalid JSON body.", 400);
    }

    const parsed = chatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed.", 400, {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { conversationId, messages, mode } = parsed.data;

    const conversation = await db.conversation.findUnique({
      where: { id: conversationId, userId: session.user.id },
      select: { id: true },
    });

    if (!conversation) {
      return apiError("Conversation not found.", 404);
    }

    // Find the last user message to persist
    const lastUserMessage = [...messages].reverse().find(
      (m) => m.role === "user"
    );

    if (lastUserMessage) {
      await db.message.create({
        data: {
          conversationId,
          role: "USER",
          content:
            typeof lastUserMessage.content === "string"
              ? lastUserMessage.content
              : JSON.stringify(lastUserMessage.content),
        },
      });
    }

    const ip = getClientIp(request);
    const requestId = getRequestId(request);

    const result = await createChatStream({
      mode,
      messages,
      userId: session.user.id,
      conversationId,
      requestId,
    });

    const { executionId } = result;

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          const encoder = new TextEncoder();

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "execution_id", executionId })}\n\n`
            )
          );

          for await (const chunk of result.stream.textStream) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "text_delta", text: chunk })}\n\n`
              )
            );
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          const encoder = new TextEncoder();
          const msg = err instanceof Error ? err.message : "Stream error";
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", error: msg })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    // Suppress unused variable warning — ip is captured for audit context
    void ip;

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("[chat POST]", err);
    return apiError("An unexpected error occurred.", 500);
  }
}
