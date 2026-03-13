import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getModeDisplayName } from "@/lib/ai/modes";
import { ChatInterface } from "@/components/chat/chat-interface";
import { Badge } from "@/components/ui/badge";
import type { ChatMessage } from "@/types";

export const metadata: Metadata = {
  title: "Chat",
};

interface PageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function ConversationPage({ params }: PageProps) {
  const { conversationId } = await params;
  const session = await requireSession();

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take: 50,
      },
    },
  });

  if (!conversation) {
    notFound();
  }

  if (conversation.userId !== session.user.id) {
    // Return 403-equivalent: render a forbidden message
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center px-6 py-12">
          <h1 className="text-xl font-semibold text-black mb-2">
            Access Denied
          </h1>
          <p className="text-gray-500 text-sm">
            You do not have permission to view this conversation.
          </p>
        </div>
      </div>
    );
  }

  const initialMessages: ChatMessage[] = conversation.messages.map((msg) => ({
    id: msg.id,
    role: msg.role.toLowerCase() as "user" | "assistant",
    content: msg.content,
    executionId: msg.executionId ?? undefined,
    createdAt: msg.createdAt.toISOString(),
  }));

  const modeDisplayName = getModeDisplayName(conversation.mode);

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-6 py-3 border-b border-gray-100 flex items-center gap-3 bg-white">
        <h1 className="text-sm font-semibold text-black truncate">
          {conversation.title ?? "Untitled conversation"}
        </h1>
        <Badge variant="outline" className="shrink-0 text-xs">
          {modeDisplayName}
        </Badge>
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatInterface
          conversationId={conversation.id}
          initialMode={conversation.mode}
          initialMessages={initialMessages}
        />
      </div>
    </div>
  );
}
