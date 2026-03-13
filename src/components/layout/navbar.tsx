import Link from "next/link";
import { getSession } from "@/lib/auth/session";

export async function Navbar() {
  const session = await getSession();

  return (
    <header className="border-b border-gray-200">
      <nav className="max-w-wide mx-auto px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-sm font-semibold uppercase tracking-widest"
        >
          Laozi
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/about"
            className="text-sm text-gray-600 hover:text-black transition-colors"
          >
            About
          </Link>
          <Link
            href="/modes"
            className="text-sm text-gray-600 hover:text-black transition-colors"
          >
            Modes
          </Link>
          <Link
            href="/pricing"
            className="text-sm text-gray-600 hover:text-black transition-colors"
          >
            Pricing
          </Link>

          {session ? (
            <Link
              href="/chat"
              className="text-sm bg-black text-white px-4 py-1.5 hover:bg-gray-800 transition-colors"
            >
              Open
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="text-sm text-gray-600 hover:text-black transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/auth/register"
                className="text-sm bg-black text-white px-4 py-1.5 hover:bg-gray-800 transition-colors"
              >
                Start
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
