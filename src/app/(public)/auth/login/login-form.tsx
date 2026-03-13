"use client";

import Link from "next/link";
import { useState } from "react";

type FormState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "error"; message: string; code?: string };

export function LoginForm() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [state, setState] = useState<FormState>({ status: "idle" });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ status: "submitting" });

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      if (res.ok) {
        window.location.href = "/chat";
        return;
      }

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
      };

      const code = data.code ?? "";
      const message =
        code === "EMAIL_NOT_VERIFIED"
          ? "Check your email to verify your account."
          : (data.error ?? "Invalid email or password.");

      setState({ status: "error", message, code });
    } catch {
      setState({
        status: "error",
        message: "Could not reach the server. Check your connection.",
      });
    }
  }

  const isSubmitting = state.status === "submitting";

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={handleChange}
          placeholder="you@example.com"
          className="w-full border border-gray-200 bg-white px-4 py-3 text-sm text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
        />
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="password"
            className="text-xs font-semibold uppercase tracking-widest text-gray-500"
          >
            Password
          </label>
          <Link
            href="/auth/forgot-password"
            className="text-xs text-gray-400 hover:text-black transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={form.password}
          onChange={handleChange}
          placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
          className="w-full border border-gray-200 bg-white px-4 py-3 text-sm text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
        />
      </div>

      {/* Error */}
      {state.status === "error" && (
        <p
          className="text-sm text-system-error"
          role="alert"
          aria-live="polite"
        >
          {state.message}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-black text-white text-sm font-medium px-6 py-3 hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
