"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface RevokeAdminSessionButtonProps {
  sessionId: string;
}

export function RevokeAdminSessionButton({
  sessionId,
}: RevokeAdminSessionButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRevoke() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/sessions/${sessionId}`, {
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
    <button
      onClick={handleRevoke}
      disabled={loading}
      className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "Revoking…" : "Revoke"}
    </button>
  );
}
