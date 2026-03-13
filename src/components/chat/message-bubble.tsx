"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "@/types";

interface MessageBubbleProps {
  message: ChatMessage;
  onFeedback?: (executionId: string) => void;
  onConvertNote?: (message: ChatMessage) => void;
}

export function MessageBubble({
  message,
  onFeedback,
  onConvertNote,
}: MessageBubbleProps) {
  const [actionsVisible, setActionsVisible] = useState(false);
  const isUser = message.role === "user";

  return (
    <div
      className={`group flex ${isUser ? "justify-end" : "justify-start"}`}
      onMouseEnter={() => setActionsVisible(true)}
      onMouseLeave={() => setActionsVisible(false)}
    >
      <div
        className={`max-w-2xl ${
          isUser ? "bg-black text-white" : "bg-gray-50 border border-gray-200 text-black"
        } px-4 py-3`}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose-chat text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Actions — only on assistant messages */}
        {!isUser && actionsVisible && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-200">
            {message.executionId && onFeedback && (
              <button
                onClick={() => onFeedback(message.executionId!)}
                className="text-xs text-gray-400 hover:text-black transition-colors"
              >
                Feedback
              </button>
            )}
            {onConvertNote && (
              <button
                onClick={() => onConvertNote(message)}
                className="text-xs text-gray-400 hover:text-black transition-colors"
              >
                Save as note
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function StreamingBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-2xl bg-gray-50 border border-gray-200 px-4 py-3">
        <div className="prose-chat text-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          {content.length === 0 && (
            <span className="inline-block w-0.5 h-4 bg-gray-400 cursor-blink align-text-bottom" />
          )}
        </div>
        {content.length > 0 && (
          <span className="inline-block w-0.5 h-3.5 bg-gray-400 cursor-blink align-text-bottom ml-0.5" />
        )}
      </div>
    </div>
  );
}
