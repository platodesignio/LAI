import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Create account",
};

export default function RegisterPage() {
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
          <h1 className="text-2xl font-light text-black">Create account</h1>
          <p className="text-sm text-gray-500 mt-2">Free. No card required.</p>
        </div>

        <RegisterForm />

        {/* Footer links */}
        <div className="mt-8 pt-8 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-black underline underline-offset-4 hover:text-gray-600 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
