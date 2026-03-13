"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface RevokeSessionButtonProps {
  sessionId: string;
}

export function RevokeSessionButton({ sessionId }: RevokeSessionButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRevoke() {
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/sessions/${sessionId}`, {
        method: "DELETE",
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
      onClick={handleRevoke}
      disabled={loading}
      className="text-xs text-red-600 hover:text-red-800 px-2 py-1"
    >
      {loading ? "Revoking…" : "Revoke"}
    </Button>
  );
}
