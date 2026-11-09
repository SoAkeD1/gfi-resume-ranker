import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import "./globals.css";

const geistSans = localFont({ src: "./fonts/GeistVF.woff", variable: "--font-geist-sans", weight: "100 900" });

export const metadata: Metadata = {
  title: "Resume Ranker — LCA & UI/UX",
  description: "Screens and ranks resumes for the LCA Consultant and UI/UX Design Intern roles, with the reason for every score.",
};

const NAV = [
  { href: "/", label: "Rankings" },
  { href: "/upload", label: "Upload a resume" },
  { href: "/issues", label: "Problems" },
  { href: "/how-it-works", label: "How scoring works" },
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} font-[family-name:var(--font-geist-sans)] antialiased`}>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-emerald-600 text-sm text-white">R</span>
              Resume Ranker
            </Link>
            <nav className="flex flex-wrap gap-1 text-sm">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 pb-8 text-xs text-slate-400">
          Prototype for the Growth For Impact assignment. Scores are a screening aid — a person makes the final decision.
        </footer>
      </body>
    </html>
  );
}
