// Full candidate view: classification, both score breakdowns, and everything that was extracted.
// Used by /candidate/[id] and by the upload result.
import type { Result } from "@/lib/types";
import type { Role } from "@/lib/skills";
import { Card, LabelBadge } from "./ui";
import { ScoreCard } from "./ScoreCard";

const LEVEL_STYLE = {
  error: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-sky-200 bg-sky-50 text-sky-900",
} as const;
const LEVEL_TEXT = { error: "Could not read", warning: "Check this", info: "Note" } as const;

export function CandidateView({ r, role, total, uploaded = false }: { r: Result; role: Role; total: number; uploaded?: boolean }) {
  const order: Role[] = role === "uiux" ? ["uiux", "lca"] : ["lca", "uiux"];
  const lcaSkills = r.skills.filter((s) => s.role === "lca");
  const uxSkills = r.skills.filter((s) => s.role === "uiux");

  return (
    <div className="space-y-5">
      {/* Header */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{r.id}</h1>
            <p className="text-slate-600">{r.headline ?? "No headline found"}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <LabelBadge label={r.classification.label} />
            {!uploaded && (
              <a href={`/resumes/${encodeURIComponent(r.sourceFile)}`} download
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                ⬇ Open original resume
              </a>
            )}
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-700"><b>Why this label:</b> {r.classification.reason}</p>
        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-4">
          <Stat label="Total experience" value={r.experience.totalYears === null ? "unknown" : `${r.experience.totalYears} yrs`} />
          <Stat label="LCA experience" value={`${r.experience.relevantYears.lca ?? 0} yrs`} />
          <Stat label="Design experience" value={`${r.experience.relevantYears.uiux ?? 0} yrs`} />
          <Stat label="LCA projects" value={String(r.lcaProjectCount.count)} />
        </div>
        {r.experience.claimedEvidence && (
          <p className="mt-2 text-xs text-slate-500">Resume itself says: “{r.experience.claimedEvidence}”. Years above are calculated from job dates, overlaps counted once.</p>
        )}
      </Card>

      {/* Problems */}
      {r.flags.length > 0 && (
        <Card>
          <h2 className="mb-2 font-semibold text-slate-900">Data problems ({r.flags.length})</h2>
          <ul className="space-y-1.5">
            {r.flags.map((f, i) => (
              <li key={i} className={`rounded-md border px-3 py-2 text-sm ${LEVEL_STYLE[f.level]}`}>
                <b>{LEVEL_TEXT[f.level]}:</b> {f.message}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Human review */}
      {!uploaded && (
        <Card className={r.review.status === "not reviewed" ? "" : "border-emerald-200"}>
          <h2 className="font-semibold text-slate-900">Human review</h2>
          {r.review.status === "not reviewed" ? (
            <p className="mt-1 text-sm text-slate-500">Not checked by a person yet (low-priority: no warnings and not in the top 5).</p>
          ) : (
            <>
              <p className="mt-1 text-sm text-emerald-800">
                ✓ {r.review.status === "corrected" ? "Checked and corrected" : "Checked — extracted data matches the resume"}
              </p>
              {r.review.notes && <p className="mt-1 text-sm text-slate-700">{r.review.notes}</p>}
              {r.review.changes.length > 0 && (
                <ul className="mt-2 text-sm text-slate-700">
                  {r.review.changes.map((c, i) => (
                    <li key={i}>Changed <code className="rounded bg-slate-100 px-1">{c.field}</code>: {String(c.from)} → <b>{String(c.to)}</b></li>
                  ))}
                </ul>
              )}
            </>
          )}
        </Card>
      )}

      {/* Scores */}
      <div className="grid gap-5 lg:grid-cols-2">
        {order.map((k) => <ScoreCard key={k} score={r.scores[k]} rank={r.rank[k]} of={total} />)}
      </div>

      {/* Extracted information */}
      <h2 className="pt-2 text-lg font-semibold text-slate-900">What we read from the resume</h2>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h3 className="mb-2 font-semibold">Work experience ({r.jobs.length})</h3>
          {r.jobs.length === 0 && <p className="text-sm text-slate-500">No jobs found.</p>}
          <ol className="space-y-3">
            {r.jobs.map((j, i) => (
              <li key={i} className="text-sm">
                <div className="font-medium text-slate-900">{j.title}{j.company && <span className="font-normal text-slate-600"> — {j.company}</span>}</div>
                <div className="text-xs text-slate-500">
                  {j.dates.raw || "no dates"}{j.dates.months > 0 && ` · ${j.dates.months} months`}
                  {j.isInternship && " · internship"}
                  {j.relevantTo.includes("lca") && <Tag c="emerald">LCA work</Tag>}
                  {j.relevantTo.includes("uiux") && <Tag c="violet">Design work</Tag>}
                  {!j.relevantTo.includes("lca") && j.sustainabilityRelated && <Tag c="slate">Sustainability</Tag>}
                </div>
                {j.bullets.length > 0 && (
                  <details className="mt-1"><summary className="cursor-pointer text-xs text-slate-500">details</summary>
                    <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-slate-600">{j.bullets.map((b, k) => <li key={k}>{b}</li>)}</ul>
                  </details>
                )}
              </li>
            ))}
          </ol>
        </Card>

        <div className="space-y-5">
          <Card>
            <h3 className="mb-2 font-semibold">Education</h3>
            {r.education.length === 0 && <p className="text-sm text-slate-500">No degree found.</p>}
            <ul className="space-y-2 text-sm">
              {r.education.filter((e) => e.level !== "school").map((e, i) => (
                <li key={i}>
                  <div className="font-medium text-slate-900">{e.degree}</div>
                  <div className="text-xs text-slate-500">{[e.institution, e.endYear, e.ongoing ? "in progress" : null].filter(Boolean).join(" · ")}</div>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <h3 className="mb-2 font-semibold">Projects ({r.projects.length})</h3>
            {r.projects.length === 0 && <p className="text-sm text-slate-500">No projects section found.</p>}
            <ul className="space-y-2 text-sm">
              {r.projects.map((p, i) => (
                <li key={i}>
                  <span className="font-medium text-slate-900">{p.title}</span>
                  {p.relevantTo.includes("lca") && <Tag c="emerald">LCA</Tag>}
                  {p.relevantTo.includes("uiux") && <Tag c="violet">Design</Tag>}
                  {p.description && <p className="text-xs text-slate-600">{p.description.slice(0, 220)}{p.description.length > 220 ? "…" : ""}</p>}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <Card>
        <h3 className="mb-1 font-semibold">Skills found</h3>
        <p className="mb-3 text-xs text-slate-500">Dark = used in a job or project (counts fully). Light = only listed in a skills section (counts 60%).</p>
        <SkillRow title="LCA-related" skills={lcaSkills} color="emerald" />
        <SkillRow title="Design-related" skills={uxSkills} color="violet" />
        {r.certifications.length > 0 && (
          <div className="mt-3 text-sm"><span className="font-medium text-slate-700">Certifications: </span><span className="text-slate-600">{r.certifications.join(" · ")}</span></div>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-slate-50 px-3 py-2"><div className="text-xs text-slate-500">{label}</div><div className="font-semibold text-slate-900">{value}</div></div>;
}

function Tag({ c, children }: { c: "emerald" | "violet" | "slate"; children: React.ReactNode }) {
  const s = { emerald: "bg-emerald-50 text-emerald-700", violet: "bg-violet-50 text-violet-700", slate: "bg-slate-100 text-slate-600" }[c];
  return <span className={`ml-1.5 rounded px-1.5 py-0.5 text-[11px] font-medium ${s}`}>{children}</span>;
}

function SkillRow({ title, skills, color }: { title: string; skills: Result["skills"]; color: "emerald" | "violet" }) {
  const used = color === "emerald" ? "bg-emerald-600 text-white" : "bg-violet-600 text-white";
  const listed = color === "emerald" ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200" : "bg-violet-50 text-violet-800 ring-1 ring-violet-200";
  return (
    <div className="mb-2 flex flex-wrap items-center gap-1.5">
      <span className="w-28 text-sm font-medium text-slate-700">{title}</span>
      {skills.length === 0 && <span className="text-sm text-slate-400">none</span>}
      {skills.map((s) => (
        <span key={s.id} title={s.evidence[0]?.text} className={`rounded-full px-2.5 py-0.5 text-xs ${s.usedInWork ? used : listed}`}>{s.label}</span>
      ))}
    </div>
  );
}
