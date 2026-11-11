import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { Logo } from "@/components/ui";
import "./globals.css";

const display = Fraunces({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-display", display: "swap" });
const sans = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: "Resume Ranker — LCA & UI/UX",
  description: "Screens and ranks resumes for the LCA Consultant and UI/UX Design Intern roles, with the reason for every score.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">
        <header className="border-b border-line bg-white">
          <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-8">
            <Link href="/" className="flex items-center gap-2.5 text-ink">
              <Logo />
              <span className="font-display text-xl font-semibold tracking-[-0.01em]">Resume Ranker</span>
            </Link>
            <SiteNav />
          </div>
        </header>
        <main className="mx-auto max-w-[1240px] px-4 pb-20 pt-8 sm:px-8">{children}</main>
        <footer className="border-t border-line">
          <div className="mx-auto max-w-[1240px] px-4 py-5 text-[13px] text-ink-subtle sm:px-8">
            Prototype for the Growth For Impact assignment. Scores are a screening aid — a person makes the final decision.
          </div>
        </footer>
      </body>
    </html>
  );
}
