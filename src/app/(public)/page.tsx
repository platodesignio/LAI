import Link from "next/link";

const modes = [
  {
    code: "QM",
    name: "Quiet Mirror",
    description:
      "Returns a cleaner picture of your situation. No reassurance. No inflation.",
  },
  {
    code: "SG",
    name: "Strategic Governance",
    description:
      "Structures decisions under constraint. Separates principle from preference.",
  },
  {
    code: "CD",
    name: "Conflict Dissolution",
    description:
      "Reduces escalation. Drafts language that lowers heat.",
  },
  {
    code: "PD",
    name: "Personal Discipline",
    description:
      "Converts vague intention into repeatable protocol.",
  },
  {
    code: "IJ",
    name: "Institutional Judgment",
    description:
      "Separates private morality from legal boundary and operational feasibility.",
  },
];

const values = [
  {
    headline: "Clarity without consolation",
    body: "Accurate analysis of your situation, stripped of false comfort and unnecessary reassurance.",
  },
  {
    headline: "Structure without ideology",
    body: "Frameworks that separate facts, norms, constraints, and decisions — without imposing a viewpoint.",
  },
  {
    headline: "Protocol without grandiosity",
    body: "Practical, repeatable systems for behavior and decision-making. No inflated claims about what thinking tools can deliver.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="border-b border-gray-200">
        <div className="max-w-wide mx-auto px-6 py-24 sm:py-32">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-8">
              Laozi AI
            </p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light leading-editorial tracking-tight text-black mb-8">
              A disciplined reasoning interface.
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-2xl mb-12">
              Laozi AI clarifies situations, structures difficult decisions,
              reduces conflict escalation, and converts intention into repeatable
              protocol.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/auth/register"
                className="inline-block bg-black text-white text-sm font-medium px-8 py-3 hover:bg-gray-900 transition-colors"
              >
                Start
              </Link>
              <Link
                href="/about"
                className="inline-block border border-gray-300 text-black text-sm font-medium px-8 py-3 hover:border-black transition-colors"
              >
                Learn more
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Modes */}
      <section className="border-b border-gray-200">
        <div className="max-w-wide mx-auto px-6 py-20">
          <div className="mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
              Modes
            </p>
            <h2 className="text-2xl sm:text-3xl font-light text-black">
              Five distinct reasoning modes.
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {modes.map((mode) => (
              <Link
                key={mode.code}
                href="/modes"
                className="group flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-8 py-6 hover:bg-gray-50 -mx-2 px-2 transition-colors"
              >
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 w-8 shrink-0">
                  {mode.code}
                </span>
                <span className="text-base font-medium text-black w-52 shrink-0">
                  {mode.name}
                </span>
                <span className="text-sm text-gray-600 leading-relaxed">
                  {mode.description}
                </span>
                <span className="ml-auto text-gray-300 group-hover:text-gray-600 transition-colors text-sm hidden sm:block">
                  &rarr;
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-8">
            <Link
              href="/modes"
              className="text-sm text-gray-500 hover:text-black transition-colors underline underline-offset-4"
            >
              View full mode descriptions
            </Link>
          </div>
        </div>
      </section>

      {/* Value statements */}
      <section className="border-b border-gray-200">
        <div className="max-w-wide mx-auto px-6 py-20">
          <div className="mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
              Principles
            </p>
            <h2 className="text-2xl sm:text-3xl font-light text-black">
              What this interface does.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            {values.map((v) => (
              <div key={v.headline} className="py-8 sm:py-0 sm:px-8 first:sm:pl-0 last:sm:pr-0">
                <h3 className="text-base font-semibold text-black mb-3">
                  {v.headline}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section>
        <div className="max-w-wide mx-auto px-6 py-24 sm:py-32">
          <div className="max-w-xl">
            <h2 className="text-3xl sm:text-4xl font-light text-black leading-editorial mb-6">
              Begin with a situation.
            </h2>
            <p className="text-base text-gray-600 leading-relaxed mb-10">
              No setup required beyond an account. Pick a mode. Describe what
              you are dealing with. Receive structured analysis, not
              encouragement.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/auth/register"
                className="inline-block bg-black text-white text-sm font-medium px-8 py-3 hover:bg-gray-900 transition-colors"
              >
                Create account
              </Link>
              <Link
                href="/pricing"
                className="inline-block text-sm text-gray-500 hover:text-black transition-colors"
              >
                View pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
