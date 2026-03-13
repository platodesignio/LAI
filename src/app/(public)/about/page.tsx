import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
};

const modes = [
  {
    code: "QM",
    name: "Quiet Mirror",
    description:
      "Reflects the actual structure of your situation without emotional inflation or mechanical reassurance. Useful when you need an accurate read before deciding anything.",
  },
  {
    code: "SG",
    name: "Strategic Governance",
    description:
      "Separates norms, structure, resources, execution risks, second-order effects, and legitimacy. Applicable to organizational decisions, policy choices, and resource allocation.",
  },
  {
    code: "CD",
    name: "Conflict Dissolution",
    description:
      "Reduces escalation and drafts language that lowers heat without coaching manipulation. Useful in interpersonal disputes, institutional conflicts, and negotiation preparation.",
  },
  {
    code: "PD",
    name: "Personal Discipline",
    description:
      "Converts vague aspiration into repeatable protocol using triggers, constraints, review loops, and friction design. For building sustainable behavioral systems.",
  },
  {
    code: "IJ",
    name: "Institutional Judgment",
    description:
      "Separates private morality, public legitimacy, legal boundary, operational feasibility, and precedent effects. For decisions made on behalf of institutions or organizations.",
  },
];

export default function AboutPage() {
  return (
    <div className="max-w-content mx-auto px-6 py-16 sm:py-24">
      {/* Header */}
      <div className="mb-16 pb-16 border-b border-gray-100">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
          About
        </p>
        <h1 className="text-4xl sm:text-5xl font-light text-black leading-editorial mb-6">
          What Laozi AI is.
        </h1>
      </div>

      {/* What it is */}
      <section className="mb-16 pb-16 border-b border-gray-100">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-6">
          What it is
        </h2>
        <div className="space-y-4 text-base text-gray-800 leading-relaxed max-w-prose">
          <p>
            Laozi AI is a reflective intelligence interface for disciplined
            thinking and responsible action. It is not a chatbot. It is not a
            spiritual guide. It is not a motivational tool.
          </p>
          <p>
            It is a structured reasoning environment that separates the
            components of difficult situations — facts, norms, constraints,
            risks, and decisions — and returns analysis calibrated to the type
            of problem you are facing.
          </p>
          <p>
            Each session is mode-specific. You choose the appropriate reasoning
            mode for your situation. The interface responds within that frame.
          </p>
        </div>
      </section>

      {/* What it does */}
      <section className="mb-16 pb-16 border-b border-gray-100">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-6">
          What it does
        </h2>
        <p className="text-base text-gray-800 leading-relaxed max-w-prose mb-10">
          Five modes address distinct categories of difficult situations.
        </p>
        <div className="space-y-0 divide-y divide-gray-100">
          {modes.map((mode) => (
            <div key={mode.code} className="py-6">
              <div className="flex items-baseline gap-4 mb-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 w-8 shrink-0">
                  {mode.code}
                </span>
                <h3 className="text-base font-semibold text-black">
                  {mode.name}
                </h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed ml-12">
                {mode.description}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <Link
            href="/modes"
            className="text-sm text-gray-500 hover:text-black transition-colors underline underline-offset-4"
          >
            Full mode descriptions
          </Link>
        </div>
      </section>

      {/* What it is not */}
      <section className="mb-16 pb-16 border-b border-gray-100">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-6">
          What it is not
        </h2>
        <div className="space-y-3 max-w-prose">
          {[
            "Not a therapy service.",
            "Not a medical, legal, or financial advisor.",
            "Not a decision oracle.",
            "Not a spiritual authority.",
            "Not a replacement for qualified professional judgment.",
          ].map((item) => (
            <div key={item} className="flex items-start gap-3">
              <span className="text-gray-300 mt-0.5 shrink-0">&mdash;</span>
              <p className="text-base text-gray-800">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Safety */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-6">
          Safety and appropriate use
        </h2>
        <div className="space-y-4 text-base text-gray-800 leading-relaxed max-w-prose">
          <p>
            Outputs are for reflection only. Apply judgment before acting on any
            analysis produced by this interface.
          </p>
          <p>
            Consult qualified professionals for medical, legal, and financial
            decisions. Laozi AI does not have access to your complete situation,
            cannot verify the accuracy of information you provide, and cannot
            take responsibility for decisions made on the basis of its outputs.
          </p>
          <p>
            In situations involving immediate risk to life or safety, contact
            emergency services.
          </p>
        </div>
      </section>
    </div>
  );
}
