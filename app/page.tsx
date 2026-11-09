import Link from "next/link";
import { ROWS, RESULTS } from "@/lib/data";
import { JOBS } from "@/config/jobs";
import { RankingTable } from "@/components/RankingTable";
import type { Role } from "@/lib/skills";

export default function Home({ searchParams }: { searchParams: { role?: string } }) {
  const role: Role = searchParams.role === "uiux" ? "uiux" : "lca";
  const job = JOBS[role];
  const counts = RESULTS.reduce<Record<string, number>>((m, r) => ((m[r.classification.label] = (m[r.classification.label] ?? 0) + 1), m), {});
  const reviewed = RESULTS.filter((r) => r.review.status !== "not reviewed").length;
  const strong = ROWS.filter((r) => r.score[role] >= 50).length;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Candidate rankings</h1>
          <p className="mt-1 text-sm text-slate-600">
            {RESULTS.length} resumes, ranked separately for each job. {reviewed} were checked by a human.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
          {Object.entries(counts).map(([k, v]) => <span key={k} className="rounded-md bg-white px-2 py-1 ring-1 ring-slate-200">{k}: <b>{v}</b></span>)}
        </div>
      </div>

      {/* Role tabs */}
      <div role="tablist" className="mb-4 grid gap-3 sm:grid-cols-2">
        {(["lca", "uiux"] as Role[]).map((r) => {
          const active = r === role;
          return (
            <Link key={r} href={`/?role=${r}`} role="tab" aria-selected={active}
              className={`rounded-xl border p-4 transition ${active ? "border-emerald-500 bg-white shadow-sm ring-1 ring-emerald-500" : "border-slate-200 bg-white/60 hover:bg-white"}`}>
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-slate-900">{JOBS[r].title}</span>
                <span className="text-xs text-slate-500">{JOBS[r].experience.min}–{JOBS[r].experience.max} yrs</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{JOBS[r].summary}</p>
            </Link>
          );
        })}
      </div>

      <p className="mb-3 text-sm text-slate-600">
        <b>{strong}</b> resumes score 50 or more for <b>{job.title}</b>. Must-haves:{" "}
        {job.mustHaveGroups.map((g) => g.label + (g.label.startsWith("ISO") ? " (not scored: numbers removed by anonymisation)" : "")).join(" · ")}.{" "}
        <Link href="/how-it-works" className="text-emerald-700 underline">How is this scored?</Link>
      </p>

      <RankingTable rows={ROWS} role={role} />
    </div>
  );
}
