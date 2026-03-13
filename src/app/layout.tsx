import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s — Laozi AI",
    default: "Laozi AI",
  },
  description:
    "A disciplined reasoning interface. Laozi AI clarifies situations, structures difficult decisions, reduces conflict escalation, and converts intention into protocol.",
  keywords: ["decision making", "strategic thinking", "conflict resolution", "personal discipline"],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    siteName: "Laozi AI",
    title: "Laozi AI",
    description:
      "A disciplined reasoning interface for clarity, governance, and responsible action.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
