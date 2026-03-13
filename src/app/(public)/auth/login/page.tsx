import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
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
          <h1 className="text-2xl font-light text-black">Sign in</h1>
        </div>

        <LoginForm />

        {/* Footer links */}
        <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col gap-3">
          <p className="text-sm text-gray-500">
            No account?{" "}
            <Link
              href="/auth/register"
              className="text-black underline underline-offset-4 hover:text-gray-600 transition-colors"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
