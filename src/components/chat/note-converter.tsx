"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FormError, FormSuccess } from "@/components/ui/error";
import type { ChatMessage } from "@/types";

interface NoteConverterProps {
  message: ChatMessage;
  conversationId: string;
  onClose?: () => void;
}

const NOTE_TYPE_OPTIONS = [
  { value: "DECISION_MEMO", label: "Decision Memo" },
  { value: "JOURNAL_NOTE", label: "Journal Note" },
  { value: "OPERATIONAL_PROTOCOL", label: "Operational Protocol" },
  { value: "CONFLICT_RESPONSE_DRAFT", label: "Conflict Response Draft" },
  { value: "INSTITUTIONAL_BRIEF", label: "Institutional Brief" },
];

export function NoteConverter({
  message,
  conversationId,
  onClose,
}: NoteConverterProps) {
  const [title, setTitle] = useState("");
  const [noteType, setNoteType] = useState("DECISION_MEMO");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    setStatus("submitting");
    setError("");

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: message.content,
          noteType,
          conversationId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Request failed" })) as { error?: string };
        throw new Error(data.error ?? "Failed to save note.");
      }

      setStatus("success");
      setTimeout(() => onClose?.(), 1500);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to save note.");
    }
  }

  if (status === "success") {
    return <FormSuccess message="Note saved." />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Note title"
        id="note-title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Q3 Decision Framework"
        maxLength={200}
        autoFocus
      />
      <Select
        label="Note type"
        id="note-type"
        value={noteType}
        onChange={(e) => setNoteType(e.target.value)}
        options={NOTE_TYPE_OPTIONS}
      />
      {error && <FormError message={error} />}
      <div className="flex gap-3">
        <Button
          type="submit"
          size="sm"
          loading={status === "submitting"}
          disabled={!title.trim()}
        >
          Save note
        </Button>
        {onClose && (
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
