"use client";
// Top navigation with the current page highlighted.
// Phones: one scrollable row of links, and "Upload a resume" becomes a floating button.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BTN } from "./ui";

const LINKS = [
  { href: "/", label: "Rankings" },
  { href: "/issues", label: "Problems" },
  { href: "/how-it-works", label: "How scoring works" },
];

export function SiteNav() {
  const path = usePathname();
  const onUpload = path.startsWith("/upload");
  const isActive = (href: string) => (href === "/" ? path === "/" || path.startsWith("/candidate") : path.startsWith(href));
  return (
    <>
      <nav aria-label="Main" className="-mx-1 flex w-full items-center gap-1 overflow-x-auto px-1 text-sm sm:mx-0 sm:w-auto sm:flex-wrap sm:overflow-visible sm:px-0">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} aria-current={isActive(l.href) ? "page" : undefined}
            className={`whitespace-nowrap rounded-full px-3.5 py-2.5 transition-colors ${isActive(l.href) ? "bg-forest-tint font-semibold text-forest" : "text-ink-muted hover:bg-stone hover:text-ink"}`}>
            {l.label}
          </Link>
        ))}
        {onUpload
          ? <span aria-current="page" className="ml-2 hidden whitespace-nowrap rounded-full bg-forest-tint px-[18px] py-[11px] font-semibold text-forest sm:inline">Upload a resume</span>
          : <Link href="/upload" className={`${BTN.primary} ml-2 hidden whitespace-nowrap sm:inline-flex`}>Upload a resume <span className="arrow">→</span></Link>}
      </nav>
      {!onUpload && (
        <Link href="/upload" className={`${BTN.primary} !fixed bottom-6 right-4 z-30 min-h-[52px] shadow-[0_12px_28px_rgba(30,91,68,.35)] sm:hidden`}>
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M9 13V4m0 0L5 8m4-4 4 4M3 15h12" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Upload a resume
        </Link>
      )}
    </>
  );
}
