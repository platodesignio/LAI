"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

type VerifyState =
  | { status: "verifying" }
  | { status: "success" }
  | { status: "error"; message: string }
  | { status: "no-token" };

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<VerifyState>(
    token ? { status: "verifying" } : { status: "no-token" }
  );

  useEffect(() => {
    if (!token) {
      setState({ status: "no-token" });
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (cancelled) return;

        if (res.ok) {
          setState({ status: "success" });
        } else {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          setState({
            status: "error",
            message:
              data.error ??
              "Invalid or expired verification link.",
          });
        }
      } catch {
        if (!cancelled) {
          setState({
            status: "error",
            message: "Could not reach the server. Check your connection.",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/"
            className="text-xs font-semibold uppercase tracking-widest text-gray-400 hover:text-black transition-colors mb-8 block"
          >
            Laozi AI
          </Link>
          <h1 className="text-2xl font-light text-black">
            Email verification
          </h1>
        </div>

        {/* States */}
        {state.status === "verifying" && (
          <div className="border border-gray-200 p-8">
            <p className="text-sm text-gray-600">Verifying your email...</p>
          </div>
        )}

        {state.status === "success" && (
          <div className="border border-gray-200 p-8 space-y-4">
            <p className="text-sm font-semibold text-black">
              Email verified.
            </p>
            <p className="text-sm text-gray-600">
              Your account is now active. You can sign in.
            </p>
            <Link
              href="/auth/login"
              className="inline-block bg-black text-white text-sm font-medium px-6 py-3 hover:bg-gray-900 transition-colors"
            >
              Sign in
            </Link>
          </div>
        )}

        {state.status === "error" && (
          <div className="border border-gray-200 p-8 space-y-4">
            <p className="text-sm font-semibold text-black">
              Verification failed.
            </p>
            <p className="text-sm text-gray-600">{state.message}</p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/auth/login"
                className="text-sm text-black underline underline-offset-4 hover:text-gray-600 transition-colors"
              >
                Go to sign in
              </Link>
              <Link
                href="/contact"
                className="text-sm text-gray-500 hover:text-black transition-colors"
              >
                Contact support
              </Link>
            </div>
          </div>
        )}

        {state.status === "no-token" && (
          <div className="border border-gray-200 p-8 space-y-4">
            <p className="text-sm font-semibold text-black">
              Invalid verification link.
            </p>
            <p className="text-sm text-gray-600">
              This link is missing a verification token. Use the link from your
              verification email.
            </p>
            <Link
              href="/auth/login"
              className="inline-block text-sm text-black underline underline-offset-4 hover:text-gray-600 transition-colors"
            >
              Go to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-6 py-16">
          <div className="w-full max-w-sm">
            <div className="border border-gray-200 p-8">
              <p className="text-sm text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
