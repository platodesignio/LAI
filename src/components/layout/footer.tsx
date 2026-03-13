import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 mt-auto">
      <div className="max-w-wide mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <span className="text-xs font-semibold uppercase tracking-widest">
            Laozi AI
          </span>
          <nav className="flex flex-wrap gap-4">
            <Link href="/about" className="text-xs text-gray-500 hover:text-black transition-colors">
              About
            </Link>
            <Link href="/modes" className="text-xs text-gray-500 hover:text-black transition-colors">
              Modes
            </Link>
            <Link href="/pricing" className="text-xs text-gray-500 hover:text-black transition-colors">
              Pricing
            </Link>
            <Link href="/contact" className="text-xs text-gray-500 hover:text-black transition-colors">
              Contact
            </Link>
            <Link href="/legal/terms" className="text-xs text-gray-500 hover:text-black transition-colors">
              Terms
            </Link>
            <Link href="/legal/privacy" className="text-xs text-gray-500 hover:text-black transition-colors">
              Privacy
            </Link>
          </nav>
          <span className="text-xs text-gray-400">&copy; {year} Laozi AI</span>
        </div>
      </div>
    </footer>
  );
}
