import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-content mx-auto px-6 py-16 sm:py-24">
      {/* Header */}
      <div className="mb-16 pb-16 border-b border-gray-100">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
          Legal
        </p>
        <h1 className="text-4xl sm:text-5xl font-light text-black leading-editorial mb-4">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-500">Last updated: March 2026</p>
      </div>

      <div className="space-y-12 max-w-prose">
        {/* 1. Overview */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            1. Overview
          </h2>
          <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
            <p>
              This Privacy Policy describes how Laozi AI collects, uses, and
              handles information about you when you use our Service. We collect
              the minimum information necessary to operate the Service.
            </p>
            <p>
              By using Laozi AI, you agree to the collection and use of
              information as described in this policy.
            </p>
          </div>
        </section>

        {/* 2. Data collected */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            2. Data we collect
          </h2>
          <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
            <div>
              <h3 className="font-semibold text-black mb-2">Account data</h3>
              <p>
                When you create an account, we collect your email address and,
                optionally, your name. Passwords are stored as cryptographic
                hashes. We never store your password in plaintext.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-black mb-2">
                Conversation data
              </h3>
              <p>
                We store the content of your sessions with Laozi AI. This
                includes the mode selected, your inputs, and the outputs
                generated. This data is necessary to provide session history,
                note-taking functionality, and to improve the Service.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-black mb-2">Usage data</h3>
              <p>
                We collect information about how you use the Service, including
                which modes you use, session frequency, and approximate session
                duration. We do not use third-party analytics trackers. Usage
                data is collected through our own infrastructure.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-black mb-2">
                Technical data
              </h3>
              <p>
                We collect IP addresses (for security and abuse prevention),
                browser type, and operating system for error diagnosis and
                infrastructure management. This data is not used for behavioral
                profiling.
              </p>
            </div>
          </div>
        </section>

        {/* 3. How we use data */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            3. How we use your data
          </h2>
          <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
            <p>We use collected data to:</p>
            <ul className="space-y-2">
              {[
                "Operate and maintain the Service.",
                "Authenticate your account and maintain session state.",
                "Provide conversation history and note-taking features.",
                "Respond to support requests.",
                "Detect and prevent abuse, fraud, and security threats.",
                "Improve the Service based on aggregate usage patterns.",
                "Send transactional emails (account verification, password reset). We do not send marketing emails unless you explicitly opt in.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="text-gray-300 shrink-0 mt-0.5">
                    &mdash;
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 4. Data retention */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            4. Data retention
          </h2>
          <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
            <p>
              Account data and conversation history are retained for as long as
              your account is active. If you request account deletion, we will
              delete your personal data and conversation history within 30 days,
              except where retention is required by law.
            </p>
            <p>
              Aggregate, anonymized usage statistics may be retained
              indefinitely as they cannot be used to identify you.
            </p>
          </div>
        </section>

        {/* 5. Third-party services */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            5. Third-party services
          </h2>
          <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
            <p>
              Laozi AI uses third-party AI providers to generate responses to
              your inputs. Your conversation inputs are transmitted to these
              providers as part of generating responses. These providers are
              bound by their own data processing agreements and privacy
              policies.
            </p>
            <p>
              We use a transactional email service to send account-related
              emails. Your email address is transmitted to this service for
              delivery purposes only.
            </p>
            <p>
              We do not sell your data to third parties. We do not share your
              personal data with advertisers.
            </p>
          </div>
        </section>

        {/* 6. Cookies */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            6. Cookies
          </h2>
          <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
            <p>
              We use a single session cookie to maintain your authentication
              state. This cookie is essential to the operation of the Service
              and cannot be disabled without logging out.
            </p>
            <p>
              We do not use tracking cookies, advertising cookies, or analytics
              cookies from third-party providers.
            </p>
          </div>
        </section>

        {/* 7. Your rights */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            7. Your rights
          </h2>
          <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
            <p>You have the right to:</p>
            <ul className="space-y-2">
              {[
                "Access the personal data we hold about you.",
                "Request correction of inaccurate personal data.",
                "Request deletion of your account and associated personal data.",
                "Export your conversation history in a machine-readable format (Pro users).",
                "Object to processing of your data in certain circumstances.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="text-gray-300 shrink-0 mt-0.5">
                    &mdash;
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p>
              To exercise these rights, contact us through the{" "}
              <Link
                href="/contact"
                className="text-black underline underline-offset-4 hover:text-gray-600 transition-colors"
              >
                contact page
              </Link>
              . We will respond within 30 days.
            </p>
          </div>
        </section>

        {/* 8. Security */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            8. Security
          </h2>
          <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
            <p>
              We use industry-standard security measures including encrypted
              transmission (HTTPS), hashed password storage, and access
              controls. No system is perfectly secure. We cannot guarantee
              absolute security of your data.
            </p>
            <p>
              In the event of a data breach that affects your personal
              information, we will notify you as required by applicable law.
            </p>
          </div>
        </section>

        {/* 9. Contact */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            9. Contact
          </h2>
          <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
            <p>
              For questions about this Privacy Policy or data-related requests,
              contact us through the{" "}
              <Link
                href="/contact"
                className="text-black underline underline-offset-4 hover:text-gray-600 transition-colors"
              >
                contact page
              </Link>
              .
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
