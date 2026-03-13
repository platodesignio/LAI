"use client";

import { useState } from "react";

type FormState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "error"; message: string };

type FieldErrors = {
  password?: string;
  confirmPassword?: string;
};

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [state, setState] = useState<FormState>({ status: "idle" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function validate(): boolean {
    const errors: FieldErrors = {};

    if (!form.password) {
      errors.password = "Password is required.";
    } else if (form.password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    }

    if (!form.confirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!validate()) return;

    setState({ status: "submitting" });

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: form.password,
          confirmPassword: form.confirmPassword,
        }),
      });

      if (res.ok) {
        window.location.href = "/auth/login";
        return;
      }

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
      };

      setState({
        status: "error",
        message:
          data.error ??
          "This reset link may have expired. Request a new one.",
      });
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
      {/* New password */}
      <div>
        <label
          htmlFor="password"
          className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2"
        >
          New password <span className="text-system-error">*</span>
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={form.password}
          onChange={handleChange}
          placeholder="Minimum 8 characters"
          className={`w-full border bg-white px-4 py-3 text-sm text-black placeholder-gray-400 focus:outline-none transition-colors ${
            fieldErrors.password
              ? "border-system-error"
              : "border-gray-200 focus:border-black"
          }`}
        />
        {fieldErrors.password && (
          <p className="mt-1.5 text-xs text-system-error">
            {fieldErrors.password}
          </p>
        )}
      </div>

      {/* Confirm new password */}
      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2"
        >
          Confirm new password <span className="text-system-error">*</span>
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          value={form.confirmPassword}
          onChange={handleChange}
          placeholder="Repeat your new password"
          className={`w-full border bg-white px-4 py-3 text-sm text-black placeholder-gray-400 focus:outline-none transition-colors ${
            fieldErrors.confirmPassword
              ? "border-system-error"
              : "border-gray-200 focus:border-black"
          }`}
        />
        {fieldErrors.confirmPassword && (
          <p className="mt-1.5 text-xs text-system-error">
            {fieldErrors.confirmPassword}
          </p>
        )}
      </div>

      {/* General error */}
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
        {isSubmitting ? "Resetting..." : "Reset password"}
      </button>
    </form>
  );
}
