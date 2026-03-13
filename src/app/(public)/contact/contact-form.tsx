"use client";

import { useState } from "react";

type SubjectOption = "General" | "Technical Issue" | "Feedback" | "Business";

type FormState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success" }
  | { status: "error"; message: string };

export function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "General" as SubjectOption,
    message: "",
  });
  const [state, setState] = useState<FormState>({ status: "idle" });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ status: "submitting" });

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setState({ status: "success" });
        setForm({ name: "", email: "", subject: "General", message: "" });
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setState({
          status: "error",
          message: data.error ?? "Something went wrong. Please try again.",
        });
      }
    } catch {
      setState({ status: "error", message: "Could not reach the server. Check your connection." });
    }
  }

  if (state.status === "success") {
    return (
      <div className="border border-gray-200 p-8">
        <p className="text-sm font-semibold text-black mb-2">Message sent.</p>
        <p className="text-sm text-gray-600">We will respond within a few business days.</p>
        <button
          type="button"
          onClick={() => setState({ status: "idle" })}
          className="mt-6 text-sm text-gray-500 hover:text-black underline underline-offset-4"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
          Name
        </label>
        <input id="name" name="name" type="text" autoComplete="name" value={form.name} onChange={handleChange}
          placeholder="Optional"
          className="w-full border border-gray-200 bg-white px-4 py-3 text-sm text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
          Email <span className="text-red-600">*</span>
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required value={form.email} onChange={handleChange}
          placeholder="your@email.com"
          className="w-full border border-gray-200 bg-white px-4 py-3 text-sm text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
        />
      </div>
      <div>
        <label htmlFor="subject" className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
          Subject <span className="text-red-600">*</span>
        </label>
        <select id="subject" name="subject" required value={form.subject} onChange={handleChange}
          className="w-full border border-gray-200 bg-white px-4 py-3 text-sm text-black focus:outline-none focus:border-black appearance-none"
        >
          <option value="General">General</option>
          <option value="Technical Issue">Technical Issue</option>
          <option value="Feedback">Feedback</option>
          <option value="Business">Business</option>
        </select>
      </div>
      <div>
        <label htmlFor="message" className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
          Message <span className="text-red-600">*</span>
        </label>
        <textarea id="message" name="message" required rows={6} value={form.message} onChange={handleChange}
          placeholder="Describe your question or issue."
          className="w-full border border-gray-200 bg-white px-4 py-3 text-sm text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors resize-none"
        />
      </div>
      {state.status === "error" && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}
      <button type="submit" disabled={state.status === "submitting"}
        className="w-full bg-black text-white text-sm font-medium px-6 py-3 hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {state.status === "submitting" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
