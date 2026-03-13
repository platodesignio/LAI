import type { Metadata } from "next";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <div className="max-w-content mx-auto px-6 py-16 sm:py-24">
      {/* Header */}
      <div className="mb-16 pb-16 border-b border-gray-100">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
          Contact
        </p>
        <h1 className="text-4xl sm:text-5xl font-light text-black leading-editorial mb-6">
          Get in touch.
        </h1>
        <p className="text-base text-gray-600 leading-relaxed max-w-prose">
          For general questions, technical issues, feedback, or business
          inquiries. We do not provide support for individual session outputs —
          those are for your own reflection.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-16">
        {/* Sidebar */}
        <div className="sm:col-span-1 space-y-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
              Response time
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              We respond to most inquiries within 2 business days.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
              Pro waitlist
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              Use the contact form with subject &ldquo;Business&rdquo; to join
              the Pro waitlist.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
              Account issues
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              For login problems or account deletion requests, select
              &ldquo;Technical Issue&rdquo; in the form.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="sm:col-span-2">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
