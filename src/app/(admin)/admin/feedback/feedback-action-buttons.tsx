"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface FeedbackActionButtonsProps {
  feedbackId: string;
  reviewed: boolean;
  flagged: boolean;
}

export function FeedbackActionButtons({
  feedbackId,
  reviewed,
  flagged,
}: FeedbackActionButtonsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"review" | "flag" | null>(null);

  async function handleAction(action: "review" | "flag") {
    setLoading(action);
    try {
      const body =
        action === "review" ? { reviewed: true } : { flagged: !flagged };
      const res = await fetch(`/api/admin/feedback/${feedbackId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {!reviewed && (
        <button
          onClick={() => handleAction("review")}
          disabled={loading !== null}
          className="text-xs text-green-400 hover:text-green-300 disabled:opacity-50"
        >
          {loading === "review" ? "…" : "Review"}
        </button>
      )}
      <button
        onClick={() => handleAction("flag")}
        disabled={loading !== null}
        className={[
          "text-xs disabled:opacity-50",
          flagged
            ? "text-gray-400 hover:text-white"
            : "text-yellow-400 hover:text-yellow-300",
        ].join(" ")}
      >
        {loading === "flag" ? "…" : flagged ? "Unflag" : "Flag"}
      </button>
    </div>
  );
}
