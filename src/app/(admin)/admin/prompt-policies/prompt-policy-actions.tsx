"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ModeType } from "@prisma/client";

interface ActivateButtonProps {
  versionId: string;
}

export function ActivateButton({ versionId }: ActivateButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleActivate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/prompt-policies/${versionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
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
      onClick={handleActivate}
      disabled={loading}
      className="text-xs text-green-400 hover:text-green-300 disabled:opacity-50 border border-green-800 px-2 py-1 rounded"
    >
      {loading ? "Activating…" : "Activate"}
    </button>
  );
}

const ALL_MODES: ModeType[] = [
  "QUIET_MIRROR",
  "STRATEGIC_GOVERNANCE",
  "CONFLICT_DISSOLUTION",
  "PERSONAL_DISCIPLINE",
  "INSTITUTIONAL_JUDGMENT",
];

const MODE_LABELS: Record<ModeType, string> = {
  QUIET_MIRROR: "Quiet Mirror",
  STRATEGIC_GOVERNANCE: "Strategic Governance",
  CONFLICT_DISSOLUTION: "Conflict Dissolution",
  PERSONAL_DISCIPLINE: "Personal Discipline",
  INSTITUTIONAL_JUDGMENT: "Institutional Judgment",
};

interface CreateVersionModalProps {
  onClose: () => void;
}

function CreateVersionModal({ onClose }: CreateVersionModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<ModeType>(ALL_MODES[0]!);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [notes, setNotes] = useState("");
  const [activate, setActivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!systemPrompt.trim()) {
      setError("System prompt is required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/prompt-policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, systemPrompt, notes, activate }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error ?? "Failed to create version"
        );
      }
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">
              Create new prompt version
            </h2>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-gray-400 hover:text-white text-xl leading-none"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Mode
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as ModeType)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white"
              >
                {ALL_MODES.map((m) => (
                  <option key={m} value={m}>
                    {MODE_LABELS[m]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                System prompt
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={10}
                placeholder="Enter the system prompt…"
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-white placeholder-gray-600 resize-y"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="What changed in this version?"
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white placeholder-gray-600 resize-y"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="activate"
                checked={activate}
                onChange={(e) => setActivate(e.target.checked)}
                className="rounded"
              />
              <label
                htmlFor="activate"
                className="text-sm text-gray-300 cursor-pointer"
              >
                Activate immediately
              </label>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-900/30 border border-red-800 rounded px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="text-sm text-gray-400 hover:text-white px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="text-sm bg-white text-black px-4 py-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating…" : "Create version"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function CreateVersionButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm bg-white text-black px-4 py-2 rounded hover:bg-gray-200 transition-colors"
      >
        Create new version
      </button>
      {open && <CreateVersionModal onClose={() => setOpen(false)} />}
    </>
  );
}
