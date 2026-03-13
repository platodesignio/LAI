"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SavedNote } from "@/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormError, FormSuccess } from "@/components/ui/error";

interface NoteEditorProps {
  note: SavedNote;
}

const NOTE_TYPES = [
  "General",
  "Insight",
  "Action",
  "Reference",
  "Draft",
  "Archive",
];

export function NoteEditor({ note }: NoteEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(note.title ?? "");
  const [content, setContent] = useState(note.content ?? "");
  const [noteType, setNoteType] = useState(note.noteType ?? "General");
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, noteType }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ?? "Failed to save note"
        );
      }
      setSuccess("Note saved.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this note? This cannot be undone.")) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/notes/${note.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ?? "Failed to delete note"
        );
      }
      router.push("/notes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setDeleting(false);
    }
  }

  function handleExport() {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "note"}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <a
            href="/notes"
            className="text-sm text-gray-500 hover:text-black"
          >
            ← Notes
          </a>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExport}
            className="text-xs text-gray-600"
          >
            Export .md
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-red-600 hover:text-red-800"
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="text-xs bg-black text-white hover:bg-gray-800"
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {error && <FormError message={error} className="mb-4" />}
      {success && <FormSuccess message={success} className="mb-4" />}

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Title
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
            className="text-black border-gray-300"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Type
          </label>
          <select
            value={noteType}
            onChange={(e) => setNoteType(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black bg-white"
          >
            {NOTE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-gray-600">
              Content
            </label>
            <button
              type="button"
              onClick={() => setPreview((v) => !v)}
              className="text-xs text-gray-500 hover:text-black underline underline-offset-2"
            >
              {preview ? "Edit" : "Preview"}
            </button>
          </div>
          {preview ? (
            <div className="min-h-[300px] border border-gray-200 rounded p-4 text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 font-mono leading-relaxed">
              {content || (
                <span className="text-gray-400 italic">No content</span>
              )}
            </div>
          ) : (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note in Markdown…"
              rows={16}
              className="text-black border-gray-300 font-mono text-sm leading-relaxed"
            />
          )}
        </div>
      </div>
    </div>
  );
}
