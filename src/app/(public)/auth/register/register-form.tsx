"use client";

import Link from "next/link";
import { useState } from "react";

type FormState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success" }
  | { status: "error"; message: string };

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export function RegisterForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [state, setState] = useState<FormState>({ status: "idle" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field-level error on change
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function validate(): boolean {
    const errors: FieldErrors = {};

    if (!form.email.trim()) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Enter a valid email address.";
    }

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
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim() || undefined,
          email: form.email.trim(),
          password: form.password,
          confirmPassword: form.confirmPassword,
        }),
      });

      if (res.ok) {
        setState({ status: "success" });
        return;
      }

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        field?: keyof FieldErrors;
      };

      if (data.field && data.error) {
        setFieldErrors({ [data.field]: data.error });
        setState({ status: "idle" });
      } else {
        setState({
          status: "error",
          message: data.error ?? "Something went wrong. Please try again.",
        });
      }
    } catch {
      setState({
        status: "error",
        message: "Could not reach the server. Check your connection.",
      });
    }
  }

  if (state.status === "success") {
    return (
      <div className="border border-gray-200 p-8 space-y-3">
        <p className="text-sm font-semibold text-black">
          Check your email to verify your account.
        </p>
        <p className="text-sm text-gray-600">
          We sent a verification link to{" "}
          <span className="font-medium text-black">{form.email}</span>. Click
          the link to activate your account.
        </p>
        <p className="text-sm text-gray-600">
          Once verified,{" "}
          <Link
            href="/auth/login"
            className="text-black underline underline-offset-4 hover:text-gray-600 transition-colors"
          >
            sign in
          </Link>
          .
        </p>
      </div>
    );
  }

  const isSubmitting = state.status === "submitting";

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2"
        >
          Name{" "}
          <span className="normal-case font-normal tracking-normal text-gray-400">
            (optional)
          </span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Your name"
          className="w-full border border-gray-200 bg-white px-4 py-3 text-sm text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
        />
        {fieldErrors.name && (
          <p className="mt-1.5 text-xs text-system-error">
            {fieldErrors.name}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2"
        >
          Email <span className="text-system-error">*</span>
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
          className={`w-full border bg-white px-4 py-3 text-sm text-black placeholder-gray-400 focus:outline-none transition-colors ${
            fieldErrors.email ? "border-system-error" : "border-gray-200 focus:border-black"
          }`}
        />
        {fieldErrors.email && (
          <p className="mt-1.5 text-xs text-system-error">
            {fieldErrors.email}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="password"
          className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2"
        >
          Password <span className="text-system-error">*</span>
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

      {/* Confirm password */}
      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2"
        >
          Confirm password <span className="text-system-error">*</span>
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          value={form.confirmPassword}
          onChange={handleChange}
          placeholder="Repeat your password"
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
        {isSubmitting ? "Creating account..." : "Create account"}
      </button>

      <p className="text-xs text-gray-400 leading-relaxed">
        By creating an account you agree to the{" "}
        <a
          href="/legal/terms"
          className="text-gray-600 hover:text-black transition-colors underline underline-offset-2"
        >
          Terms of Service
        </a>{" "}
        and{" "}
        <a
          href="/legal/privacy"
          className="text-gray-600 hover:text-black transition-colors underline underline-offset-2"
        >
          Privacy Policy
        </a>
        .
      </p>
    </form>
  );
}
