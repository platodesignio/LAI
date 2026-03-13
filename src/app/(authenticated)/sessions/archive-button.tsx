"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface ArchiveButtonProps {
  conversationId: string;
}

export function ArchiveButton({ conversationId }: ArchiveButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleArchive() {
    setLoading(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: true }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleArchive}
      disabled={loading}
      className="text-xs text-gray-500 hover:text-black px-2 py-1"
    >
      {loading ? "Archiving…" : "Archive"}
    </Button>
  );
}
