import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Reset password",
};

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return <ResetPasswordPageInner searchParams={searchParams} />;
}

async function ResetPasswordPageInner({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token;

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
          <h1 className="text-2xl font-light text-black">Reset password</h1>
        </div>

        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="border border-gray-200 p-8 space-y-4">
            <p className="text-sm font-semibold text-black">
              Invalid reset link.
            </p>
            <p className="text-sm text-gray-600">
              This link is missing a reset token. Request a new link from the
              forgot password page.
            </p>
            <Link
              href="/auth/forgot-password"
              className="inline-block text-sm text-black underline underline-offset-4 hover:text-gray-600 transition-colors"
            >
              Request new link
            </Link>
          </div>
        )}

        {/* Footer links */}
        <div className="mt-8 pt-8 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            <Link
              href="/auth/login"
              className="text-black underline underline-offset-4 hover:text-gray-600 transition-colors"
            >
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
