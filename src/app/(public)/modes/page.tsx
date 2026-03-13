import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Modes",
};

const modes = [
  {
    code: "QM",
    slug: "QUIET_MIRROR",
    name: "Quiet Mirror",
    tagline: "Accurate situational reflection.",
    description:
      "Reflects the actual structure of the user's situation without emotional inflation and without mechanical reassurance. Quiet Mirror returns what is present in the situation — not what the user wants to hear, and not generic coping language. It surfaces omissions, contradictions, and unstated assumptions.",
    detail:
      "This mode is appropriate when you are unsure whether your read of a situation is accurate, when you suspect you are rationalizing, or when you need someone to describe what is actually happening before you decide anything. It does not advise. It reflects.",
    useCases: [
      "You have made a decision and want to check whether you are missing something important before committing.",
      "You are in a difficult situation and your thinking feels clouded — you need a clean description before any strategy.",
      "You are unsure whether your emotional state is distorting your assessment of the facts.",
    ],
  },
  {
    code: "SG",
    slug: "STRATEGIC_GOVERNANCE",
    name: "Strategic Governance",
    tagline: "Structured decision-making under constraint.",
    description:
      "Separates norms, structure, resources, execution risks, second-order effects, and legitimacy. Strategic Governance applies a disciplined analytical framework to complex organizational and strategic decisions. It does not make the decision for you. It surfaces the components you need to reason about.",
    detail:
      "This mode is appropriate for decisions involving multiple stakeholders, significant resource allocation, institutional consequences, or long time horizons. It treats strategy as a structured problem, not an exercise in conviction.",
    useCases: [
      "You are deciding whether to restructure a team, a process, or a resource allocation, and need to think through execution risk and second-order consequences.",
      "You are facing a governance decision that involves competing norms or stakeholder interests that need to be separated and assessed.",
      "You need to evaluate the legitimacy and feasibility of a proposed course of action before committing to it.",
    ],
  },
  {
    code: "CD",
    slug: "CONFLICT_DISSOLUTION",
    name: "Conflict Dissolution",
    tagline: "Reducing escalation without manipulation.",
    description:
      "Reduces escalation and drafts language that lowers heat without coaching manipulation. Conflict Dissolution maps the structure of a conflict — positions, interests, histories, and distortions — and produces language designed to reduce friction rather than win the exchange.",
    detail:
      "This mode is not a negotiation coach in the sense of teaching you to extract concessions. It is a tool for lowering the temperature of difficult interpersonal or institutional exchanges so that productive communication becomes possible. It does not take sides.",
    useCases: [
      "You are preparing for a difficult conversation — a termination, a confrontation, a negotiation — and need language that is clear but not inflammatory.",
      "A dispute has escalated and you need to understand the structure of the conflict before responding.",
      "You need to communicate a difficult decision to a person or group and want to reduce the likelihood of defensive escalation.",
    ],
  },
  {
    code: "PD",
    slug: "PERSONAL_DISCIPLINE",
    name: "Personal Discipline",
    tagline: "Converting intention into protocol.",
    description:
      "Converts vague aspiration into repeatable protocol using triggers, constraints, review loops, and friction design. Personal Discipline takes what you want to do and turns it into a specific, time-anchored, friction-conscious behavioral system that can actually run.",
    detail:
      "This mode treats behavioral change as an engineering problem, not a motivation problem. It does not encourage you. It builds a system. The system includes implementation intentions, obstacle anticipation, review points, and failure recovery procedures.",
    useCases: [
      "You have an intention you have failed to execute repeatedly and need to design a system that removes reliance on motivation.",
      "You want to establish a new routine and need to map out triggers, constraints, and review loops before beginning.",
      "You need to design a protocol for a recurring decision or behavior that currently relies on willpower and therefore fails under pressure.",
    ],
  },
  {
    code: "IJ",
    slug: "INSTITUTIONAL_JUDGMENT",
    name: "Institutional Judgment",
    tagline: "Separating morality, legality, and feasibility.",
    description:
      "Separates private morality, public legitimacy, legal boundary, operational feasibility, and precedent effects. Institutional Judgment is for decisions made on behalf of institutions, organizations, or in representative roles — where the decision-maker's personal ethics and institutional obligations may diverge.",
    detail:
      "This mode is appropriate when you are acting in a fiduciary, institutional, or representative capacity and need to distinguish between what you personally believe is right and what your role requires or permits. It maps the decision space without resolving it for you.",
    useCases: [
      "You are in a leadership or governance role and face a decision where your personal values conflict with institutional obligations or legal requirements.",
      "You need to evaluate a policy decision by separating its moral, legal, operational, and precedent dimensions.",
      "You are advising an institution on a course of action and need a structured analysis of the constraints that apply to that decision.",
    ],
  },
];

export default function ModesPage() {
  return (
    <div className="max-w-content mx-auto px-6 py-16 sm:py-24">
      {/* Header */}
      <div className="mb-16 pb-16 border-b border-gray-100">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
          Modes
        </p>
        <h1 className="text-4xl sm:text-5xl font-light text-black leading-editorial mb-6">
          Five reasoning modes.
        </h1>
        <p className="text-base text-gray-600 leading-relaxed max-w-prose">
          Each mode addresses a distinct category of difficult situation. Select
          the mode that matches the type of problem you are dealing with before
          beginning a session.
        </p>
      </div>

      {/* Modes */}
      <div className="space-y-0 divide-y divide-gray-100">
        {modes.map((mode) => (
          <section key={mode.code} className="py-16">
            <div className="flex items-start gap-6 mb-6">
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 mt-1.5 w-8 shrink-0">
                {mode.code}
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
                  {mode.slug}
                </p>
                <h2 className="text-2xl sm:text-3xl font-light text-black leading-editorial">
                  {mode.name}
                </h2>
                <p className="text-sm text-gray-500 mt-1">{mode.tagline}</p>
              </div>
            </div>

            <div className="ml-14 space-y-5 max-w-prose">
              <p className="text-base text-gray-800 leading-relaxed">
                {mode.description}
              </p>
              <p className="text-base text-gray-600 leading-relaxed">
                {mode.detail}
              </p>

              <div className="pt-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
                  Example use cases
                </p>
                <ul className="space-y-3">
                  {mode.useCases.map((useCase, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-gray-300 shrink-0 mt-0.5">
                        &mdash;
                      </span>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {useCase}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* CTA */}
      <div className="pt-16 mt-4 border-t border-gray-100">
        <p className="text-base text-gray-600 leading-relaxed mb-6 max-w-prose">
          Modes are selected at the start of each session. You can run multiple
          sessions with different modes for the same situation.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/auth/register"
            className="inline-block bg-black text-white text-sm font-medium px-8 py-3 hover:bg-gray-900 transition-colors"
          >
            Start
          </Link>
          <Link
            href="/pricing"
            className="inline-block border border-gray-300 text-black text-sm font-medium px-8 py-3 hover:border-black transition-colors"
          >
            View pricing
          </Link>
        </div>
      </div>
    </div>
  );
}
