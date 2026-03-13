"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormError, FormSuccess } from "@/components/ui/error";

interface FeedbackFormProps {
  executionId: string;
  conversationId?: string;
  messageId?: string;
  onClose?: () => void;
}

export function FeedbackForm({
  executionId,
  conversationId,
  messageId,
  onClose,
}: FeedbackFormProps) {
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) {
      setError("Comment is required.");
      return;
    }

    setStatus("submitting");
    setError("");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          executionId,
          conversationId,
          messageId,
          comment: comment.trim(),
          rating: rating ?? undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Request failed" })) as { error?: string };
        throw new Error(data.error ?? "Failed to submit feedback.");
      }

      setStatus("success");
      setTimeout(() => onClose?.(), 1500);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to submit feedback.");
    }
  }

  if (status === "success") {
    return <FormSuccess message="Feedback submitted. Thank you." />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">
          Rating (optional)
        </p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(rating === n ? null : n)}
              className={`w-8 h-8 text-xs border transition-colors ${
                rating === n
                  ? "bg-black text-white border-black"
                  : "border-gray-300 text-gray-600 hover:border-black"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <Textarea
        label="Comment"
        id="feedback-comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="What was useful or unhelpful?"
        rows={3}
        maxLength={2000}
      />

      {error && <FormError message={error} />}

      <div className="flex gap-3">
        <Button
          type="submit"
          size="sm"
          loading={status === "submitting"}
          disabled={!comment.trim()}
        >
          Submit
        </Button>
        {onClose && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
