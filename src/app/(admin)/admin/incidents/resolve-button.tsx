"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ResolveButtonProps {
  incidentId: string;
}

export function ResolveButton({ incidentId }: ResolveButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleResolve() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/incidents/${incidentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolved: true }),
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
      onClick={handleResolve}
      disabled={loading}
      className="text-xs text-green-400 hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "…" : "Resolve"}
    </button>
  );
}
