import type { ModeType } from "@prisma/client";
import type { CoreMessage } from "ai";
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { getActiveModePrompt } from "@/lib/ai/modes";
import { getActiveAIProvider } from "@/lib/feature-flags";
import { preModelSafetyCheck, postModelSafetyCheck } from "@/lib/ai/safety";
import { generateExecutionId } from "@/lib/utils/ids";
import { logger } from "@/lib/utils/logger";
import { db } from "@/lib/db";

export interface ChatStreamOptions {
  mode: ModeType;
  messages: CoreMessage[];
  userId: string;
  conversationId: string;
  requestId?: string;
}

export interface ChatStreamResult {
  executionId: string;
  stream: ReturnType<typeof streamText>;
  provider: string;
  model: string;
  promptVersionId: string;
}

// Safety disclaimer appended to blocked outputs
const BLOCKED_RESPONSE =
  "This request cannot be processed. If you are in crisis, please contact emergency services or a crisis line.";

/**
 * Core AI invocation with:
 * - Mode-based prompt routing from DB
 * - Pre and post safety filtering
 * - Execution ID generation and metadata persistence
 * - Provider abstraction (Anthropic / OpenAI)
 */
export async function createChatStream(
  options: ChatStreamOptions
): Promise<ChatStreamResult> {
  const executionId = generateExecutionId();
  const startTime = Date.now();

  // Get the last user message for safety check
  const lastUserMessage = [...options.messages]
    .reverse()
    .find((m) => m.role === "user");
  const userContent =
    typeof lastUserMessage?.content === "string"
      ? lastUserMessage.content
      : "";

  // Pre-model safety check
  const preSafety = await preModelSafetyCheck(userContent, {
    userId: options.userId,
    executionId,
    requestId: options.requestId,
  });

  if (!preSafety.safe) {
    // Return a stream that immediately emits the blocked response
    const blockedStream = streamText({
      model: anthropic(
        process.env["ANTHROPIC_MODEL"] ?? "claude-3-5-sonnet-20241022"
      ),
      messages: [{ role: "user", content: "Hello." }],
      system: `You must respond with exactly this text and nothing else: "${BLOCKED_RESPONSE}"`,
      maxTokens: 50,
    });
    return {
      executionId,
      stream: blockedStream,
      provider: "blocked",
      model: "none",
      promptVersionId: "blocked",
    };
  }

  // Load mode system prompt from DB
  const { systemPrompt, promptVersionId } = await getActiveModePrompt(
    options.mode
  );

  // Determine active provider
  const providerName = await getActiveAIProvider();
  const model = getModel(providerName);
  const modelName = getModelName(providerName);

  logger.info("Starting chat stream", {
    executionId,
    provider: providerName,
    model: modelName,
    mode: options.mode,
    userId: options.userId,
    conversationId: options.conversationId,
  });

  // Invoke AI
  const streamResult = streamText({
    model,
    system: systemPrompt,
    messages: options.messages,
    maxTokens: 2000,
    onFinish: async (result) => {
      const durationMs = Date.now() - startTime;

      // Post-model safety check on finished output
      const postSafety = await postModelSafetyCheck(result.text, {
        userId: options.userId,
        executionId,
        requestId: options.requestId,
      });

      // Persist the assistant message
      try {
        await db.message.create({
          data: {
            conversationId: options.conversationId,
            role: "ASSISTANT",
            content: postSafety.safe ? result.text : BLOCKED_RESPONSE,
            executionId,
            modelProvider: providerName,
            modelName,
            promptVersionId: promptVersionId === "fallback" ? null : promptVersionId,
            inputTokens: result.usage?.promptTokens,
            outputTokens: result.usage?.completionTokens,
            durationMs,
          },
        });

        // Update conversation updatedAt
        await db.conversation.update({
          where: { id: options.conversationId },
          data: { updatedAt: new Date() },
        });
      } catch (err) {
        logger.error("Failed to persist assistant message", {
          executionId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    },
  });

  return {
    executionId,
    stream: streamResult,
    provider: providerName,
    model: modelName,
    promptVersionId,
  };
}

function getModel(provider: "anthropic" | "openai") {
  if (provider === "openai") {
    return openai(process.env["OPENAI_MODEL"] ?? "gpt-4o");
  }
  return anthropic(
    process.env["ANTHROPIC_MODEL"] ?? "claude-3-5-sonnet-20241022"
  );
}

function getModelName(provider: "anthropic" | "openai"): string {
  if (provider === "openai") {
    return process.env["OPENAI_MODEL"] ?? "gpt-4o";
  }
  return process.env["ANTHROPIC_MODEL"] ?? "claude-3-5-sonnet-20241022";
}
