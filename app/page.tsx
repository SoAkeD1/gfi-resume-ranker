import Link from "next/link";
import { ROWS, RESULTS } from "@/lib/data";
import { JOBS } from "@/config/jobs";
import { RankingTable } from "@/components/RankingTable";
import { Contours, Eyebrow, LABEL_INK, LABEL_TEXT } from "@/components/ui";
import type { Label } from "@/lib/classify";
import type { Role } from "@/lib/skills";

const ROLE_DOT: Record<Role, string> = { lca: "bg-forest", uiux: "bg-plum" };
const ROLE_ACTIVE: Record<Role, string> = {
  lca: "border-forest shadow-[0_10px_30px_rgba(23,32,27,.08),inset_0_-4px_0_#1E5B44]",
  uiux: "border-plum shadow-[0_10px_30px_rgba(23,32,27,.08),inset_0_-4px_0_#5A3EA6]",
};

export default function Home({ searchParams }: { searchParams: { role?: string } }) {
  const role: Role = searchParams.role === "uiux" ? "uiux" : "lca";
  const job = JOBS[role];
  const counts = RESULTS.reduce<Record<string, number>>((m, r) => ((m[r.classification.label] = (m[r.classification.label] ?? 0) + 1), m), {});
  const reviewed = RESULTS.filter((r) => r.review.status !== "not reviewed").length;
  const strong = ROWS.filter((r) => r.score[role] >= 50).length;

  return (
    <div>
      <section className="relative flex flex-wrap items-end justify-between gap-6 pb-7">
        <Contours className="absolute -right-5 -top-8 hidden w-[520px] opacity-[0.09] md:block" />
        <div className="anim-rise relative">
          <Eyebrow>Growth For Impact · Screening</Eyebrow>
          <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-[-0.02em] sm:text-5xl">Candidate rankings</h1>
          <p className="mt-2.5 text-base text-ink-muted">
            {RESULTS.length} resumes, ranked separately for each job. {reviewed} were checked by a person.
          </p>
        </div>
        <div className="anim-rise relative flex flex-wrap gap-2" style={{ animationDelay: "80ms" }}>
          {(["LCA", "UI/UX", "Both", "Neither", "Uncertain"] as Label[]).filter((k) => counts[k]).map((k) => (
            <span key={k} className="rounded-[10px] border border-line bg-white px-3 py-2 text-[13px] text-ink-muted">
              {LABEL_TEXT[k]} <b className={`ml-1 font-display text-lg ${LABEL_INK[k]}`}>{counts[k]}</b>
            </span>
          ))}
        </div>
      </section>

      <div role="tablist" aria-label="Choose a job" className="mb-5 grid gap-4 sm:grid-cols-2">
        {(["lca", "uiux"] as Role[]).map((r) => {
          const active = r === role;
          return (
            <Link key={r} href={`/?role=${r}`} role="tab" aria-selected={active} scroll={false}
              className={`flex flex-col rounded-2xl border-[1.5px] bg-white p-5 transition duration-200 hover:-translate-y-0.5 ${active ? ROLE_ACTIVE[r] : "border-line hover:shadow-soft"}`}>
              <span className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${ROLE_DOT[r]}`} />
                  <span className="font-display text-[22px] font-semibold">{JOBS[r].title}</span>
                </span>
                <span className="text-[13px] text-ink-muted">{JOBS[r].experience.min}–{JOBS[r].experience.max} yrs</span>
              </span>
              <span className="mt-2 text-sm leading-relaxed text-ink-muted">{JOBS[r].summary}</span>
            </Link>
          );
        })}
      </div>

      <p className="mb-4 text-sm leading-relaxed text-ink-muted">
        <b className="text-ink">{strong}</b> resumes score 50 or more for <b className="text-ink">{job.title}</b>. Must-haves:{" "}
        {job.mustHaveGroups.map((g) => g.label + (g.label.startsWith("ISO") ? " (not scored: numbers removed by anonymisation)" : "")).join(" · ")}.{" "}
        <Link href="/how-it-works" className="font-medium text-forest underline underline-offset-2">How is this scored?</Link>
      </p>

      <RankingTable key={role} rows={ROWS} role={role} />
    </div>
  );
}
