"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { ModeType } from "@prisma/client";
import type { ChatMessage } from "@/types";
import { MessageBubble, StreamingBubble } from "@/components/chat/message-bubble";
import { ModeSelector } from "@/components/chat/mode-selector";
import { FeedbackForm } from "@/components/chat/feedback-form";
import { NoteConverter } from "@/components/chat/note-converter";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { ErrorDisplay } from "@/components/ui/error";

interface ChatInterfaceProps {
  conversationId: string;
  initialMode: ModeType;
  initialMessages: ChatMessage[];
}

export function ChatInterface({
  conversationId,
  initialMode,
  initialMessages,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [mode, setMode] = useState<ModeType>(initialMode);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [feedbackTarget, setFeedbackTarget] = useState<string | null>(null);
  const [noteTarget, setNoteTarget] = useState<ChatMessage | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamContent, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [input]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || streaming) return;

    setInput("");
    setError(null);

    const userMessage: ChatMessage = {
      id: `tmp_${Date.now()}`,
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setStreaming(true);
    setStreamContent("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          mode,
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Request failed" })) as { error?: string };
        throw new Error(data.error ?? "Request failed.");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No response stream.");

      let accumulatedContent = "";
      let executionId: string | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data) as { type?: string; text?: string; executionId?: string; error?: string };
              if (parsed.type === "execution_id") {
                executionId = parsed.executionId;
              } else if (parsed.type === "text_delta" && parsed.text) {
                accumulatedContent += parsed.text;
                setStreamContent(accumulatedContent);
              } else if (parsed.type === "error") {
                throw new Error(parsed.error ?? "Stream error");
              }
            } catch {
              // Non-JSON lines are ok (sometimes SSE has comments)
            }
          }
        }
      }

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: "assistant",
        content: accumulatedContent,
        executionId,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setStreaming(false);
      setStreamContent("");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Mode selector */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-200 bg-white">
        <ModeSelector value={mode} onChange={setMode} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-400">
              Begin your inquiry. Use the mode selector to set the reasoning frame.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onFeedback={
              msg.executionId
                ? (execId) => setFeedbackTarget(execId)
                : undefined
            }
            onConvertNote={
              msg.role === "assistant"
                ? (m) => setNoteTarget(m)
                : undefined
            }
          />
        ))}

        {streaming && <StreamingBubble content={streamContent} />}

        {error && (
          <ErrorDisplay
            message={error}
            retry={() => {
              setError(null);
            }}
          />
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 px-4 py-3 bg-white">
        <div className="flex gap-3 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your inquiry..."
            disabled={streaming}
            rows={1}
            className="flex-1 resize-none border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 overflow-hidden"
            style={{ minHeight: "38px", maxHeight: "160px" }}
          />
          <Button
            onClick={() => void handleSend()}
            disabled={!input.trim() || streaming}
            loading={streaming}
            size="md"
            className="shrink-0"
          >
            {streaming ? "Thinking" : "Send"}
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          Enter to send · Shift+Enter for new line
        </p>
      </div>

      {/* Feedback modal */}
      <Modal
        open={!!feedbackTarget}
        onClose={() => setFeedbackTarget(null)}
        title="Feedback"
        size="sm"
      >
        {feedbackTarget && (
          <FeedbackForm
            executionId={feedbackTarget}
            conversationId={conversationId}
            onClose={() => setFeedbackTarget(null)}
          />
        )}
      </Modal>

      {/* Note converter modal */}
      <Modal
        open={!!noteTarget}
        onClose={() => setNoteTarget(null)}
        title="Save as note"
        size="sm"
      >
        {noteTarget && (
          <NoteConverter
            message={noteTarget}
            conversationId={conversationId}
            onClose={() => setNoteTarget(null)}
          />
        )}
      </Modal>
    </div>
  );
}
