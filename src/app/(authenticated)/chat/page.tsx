import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getAllModes } from "@/lib/ai/modes";
import type { ConversationWithCount } from "@/types";
import { NewChatForm } from "./new-chat-form";

export const metadata: Metadata = {
  title: "New conversation",
};

export default async function NewChatPage() {
  const session = await requireSession();
  const userId = session.user.id;

  const [modes, rawConversations] = await Promise.all([
    Promise.resolve(getAllModes()),
    db.conversation.findMany({
      where: { userId, archived: false },
      include: { _count: { select: { messages: true } } },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  const recentConversations: ConversationWithCount[] = rawConversations;

  return (
    <NewChatForm modes={modes} recentConversations={recentConversations} />
  );
}
