"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ModeType } from "@prisma/client";
import type { ConversationWithCount } from "@/types";
import { Badge } from "@/components/ui/badge";
import { getModeDisplayName } from "@/lib/ai/modes";

interface ModeOption {
  mode: ModeType;
  name: string;
  description: string;
}

interface NewChatFormProps {
  modes: ModeOption[];
  recentConversations: ConversationWithCount[];
}

export function NewChatForm({ modes, recentConversations }: NewChatFormProps) {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<ModeType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleModeSelect(mode: ModeType) {
    setSelectedMode(mode);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ?? "Failed to create conversation"
        );
      }

      const data = (await res.json()) as { id: string };
      router.push(`/chat/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSelectedMode(null);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold text-black mb-2">
        New Conversation
      </h1>
      <p className="text-gray-500 mb-8 text-sm">
        Select a mode to begin. Each mode applies a different reasoning lens.
      </p>

      {error && (
        <div className="mb-6 px-4 py-3 border border-red-300 bg-red-50 text-red-700 text-sm rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 mb-10">
        {modes.map((m) => {
          const isSelected = selectedMode === m.mode;
          return (
            <button
              key={m.mode}
              onClick={() => !loading && handleModeSelect(m.mode)}
              disabled={loading}
              className={[
                "w-full text-left px-5 py-4 border rounded transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1",
                loading && !isSelected
                  ? "opacity-50 cursor-not-allowed border-gray-200 bg-white"
                  : isSelected
                  ? "border-black bg-black text-white cursor-default"
                  : "border-gray-200 bg-white hover:border-black hover:bg-gray-50 cursor-pointer",
              ].join(" ")}
              aria-disabled={loading}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">
                  {isSelected && loading ? "Starting…" : m.name}
                </span>
                {isSelected && loading && (
                  <span className="text-xs opacity-70">Please wait</span>
                )}
              </div>
              <p
                className={[
                  "text-xs mt-1 leading-relaxed",
                  isSelected ? "text-gray-300" : "text-gray-500",
                ].join(" ")}
              >
                {m.description}
              </p>
            </button>
          );
        })}
      </div>

      {recentConversations.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-black uppercase tracking-wide">
              Recent
            </h2>
            <a
              href="/sessions"
              className="text-xs text-gray-500 hover:text-black underline underline-offset-2"
            >
              View all sessions
            </a>
          </div>
          <div className="divide-y divide-gray-100 border border-gray-200 rounded">
            {recentConversations.map((conv) => (
              <a
                key={conv.id}
                href={`/chat/${conv.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {getModeDisplayName(conv.mode)}
                  </Badge>
                  <span className="text-sm text-gray-800 truncate group-hover:text-black">
                    {conv.title ?? "Untitled conversation"}
                  </span>
                </div>
                <span className="text-xs text-gray-400 shrink-0 ml-4">
                  {conv._count.messages}{" "}
                  {conv._count.messages === 1 ? "msg" : "msgs"}
                </span>
              </a>
            ))}
          </div>
          <div className="mt-3 text-right">
            <a
              href="/sessions"
              className="text-xs text-gray-500 hover:text-black underline underline-offset-2"
            >
              View all sessions →
            </a>
          </div>
        </div>
      )}

      {recentConversations.length === 0 && (
        <div className="text-sm text-gray-400 text-center py-6 border border-dashed border-gray-200 rounded">
          No conversations yet. Select a mode above to get started.
        </div>
      )}
    </div>
  );
}
