import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing",
};

const freeFeatures = [
  "10 conversations per month",
  "All 5 reasoning modes",
  "Note saving (up to 5 notes)",
  "Feedback submission",
];

const proFeatures = [
  "Unlimited conversations",
  "All 5 reasoning modes",
  "Unlimited notes",
  "Export sessions to Markdown",
  "Priority support",
];

export default function PricingPage() {
  return (
    <div className="max-w-content mx-auto px-6 py-16 sm:py-24">
      {/* Header */}
      <div className="mb-16 pb-16 border-b border-gray-100">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
          Pricing
        </p>
        <h1 className="text-4xl sm:text-5xl font-light text-black leading-editorial mb-6">
          Two tiers. No complexity.
        </h1>
        <p className="text-base text-gray-600 leading-relaxed max-w-prose">
          Start for free. Upgrade when your usage requires it.
        </p>
      </div>

      {/* Tiers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 sm:gap-px bg-gray-100 border border-gray-100 mb-16">
        {/* Free */}
        <div className="bg-white p-8 sm:p-10">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
              Free
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-light text-black">$0</span>
              <span className="text-sm text-gray-500">/ month</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              No payment required to get started.
            </p>
          </div>

          <ul className="space-y-3 mb-10">
            {freeFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <span className="text-gray-400 shrink-0 mt-0.5 text-xs">
                  &mdash;
                </span>
                <span className="text-sm text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/auth/register"
            className="block text-center bg-black text-white text-sm font-medium px-6 py-3 hover:bg-gray-900 transition-colors"
          >
            Create account
          </Link>
        </div>

        {/* Pro */}
        <div className="bg-white p-8 sm:p-10">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
              Pro
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-light text-black">$12</span>
              <span className="text-sm text-gray-500">/ month</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              For sustained, high-volume use.
            </p>
          </div>

          <ul className="space-y-3 mb-10">
            {proFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <span className="text-gray-400 shrink-0 mt-0.5 text-xs">
                  &mdash;
                </span>
                <span className="text-sm text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-3">
            <Link
              href="/contact"
              className="block text-center border border-black text-black text-sm font-medium px-6 py-3 hover:bg-gray-50 transition-colors"
            >
              Join waitlist
            </Link>
            <p className="text-xs text-center text-gray-400">
              Payment not yet active. Join the waitlist for early access.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-prose">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-8">
          Common questions
        </h2>
        <div className="space-y-0 divide-y divide-gray-100">
          {[
            {
              q: "What counts as a conversation?",
              a: "A conversation is a complete session with a mode selected. A session may contain multiple exchanges. The limit resets at the start of each calendar month.",
            },
            {
              q: "Can I switch modes within a conversation?",
              a: "No. Each session is committed to a single mode at the start. If you need a different analysis, open a new session with the appropriate mode.",
            },
            {
              q: "Is my data stored?",
              a: "Conversations are stored to allow note-taking and session review. See the Privacy Policy for details on retention and third-party AI providers.",
            },
            {
              q: "When will Pro payments be active?",
              a: "Payment integration is not yet active. Join the waitlist to be notified when Pro is available. Your account will remain free in the interim.",
            },
          ].map(({ q, a }) => (
            <div key={q} className="py-6">
              <h3 className="text-sm font-semibold text-black mb-2">{q}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
