import Link from "next/link";
import { BTN } from "@/components/ui";

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-[640px] flex-col items-center gap-3 rounded-3xl border border-line bg-white px-6 py-14 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-subtle">404 · not found</p>
      <svg width="220" height="90" viewBox="0 0 220 90" aria-hidden="true" className="anim-drift">
        <path d="M5 70 C50 20 100 85 150 35 S210 25 215 30" fill="none" stroke="#1E5B44" strokeWidth="1.4" opacity="0.5" />
        <path d="M5 82 C50 32 100 97 150 47 S210 37 215 42" fill="none" stroke="#1E5B44" strokeWidth="1.4" opacity="0.3" />
        <path d="M150 35 C150 22 158 14 170 14 C170 27 162 35 150 35 Z" fill="#E8F1EC" stroke="#1E5B44" strokeWidth="1.2" />
      </svg>
      <h1 className="font-display text-[32px] font-semibold">This page wandered off</h1>
      <p className="max-w-[380px] text-[15px] text-ink-muted">The candidate or page you asked for doesn&apos;t exist. It may have a different ID.</p>
      <Link href="/" className={`${BTN.primary} mt-2`}>Back to rankings</Link>
    </section>
  );
}
