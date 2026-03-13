"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/ui/error";

export function DeleteAccountButton() {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (confirmation !== "DELETE") {
      setError('Please type "DELETE" to confirm.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/delete-account", { method: "POST" });
      if (res.ok) {
        window.location.href = "/";
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ?? "Failed to delete account"
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setOpen(true)}
        className="text-sm text-red-600 border border-red-300 hover:bg-red-50 px-4 py-2"
      >
        Delete account
      </Button>

      <Modal open={open} onClose={() => !loading && setOpen(false)}>
        <div className="p-6 max-w-md">
          <h2 className="text-lg font-semibold text-black mb-2">
            Delete account
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            This action is permanent. All your conversations, notes, and data
            will be deleted. You cannot undo this.
          </p>
          <p className="text-sm font-medium text-gray-800 mb-2">
            Type <span className="font-mono font-bold">DELETE</span> to confirm:
          </p>
          <Input
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="DELETE"
            className="mb-4 border-gray-300 text-black"
            disabled={loading}
          />
          {error && <FormError message={error} className="mb-4" />}
          <div className="flex items-center gap-3 justify-end">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="text-sm text-gray-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={loading || confirmation !== "DELETE"}
              className="text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "Deleting…" : "Delete my account"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
