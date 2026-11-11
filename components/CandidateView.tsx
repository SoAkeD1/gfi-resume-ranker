// Full candidate view: label, both score breakdowns, and everything that was extracted.
// Used by /candidate/[id] and by the upload result.
import type { Result } from "@/lib/types";
import type { Role } from "@/lib/skills";
import { BTN, Card, LabelBadge } from "./ui";
import { ScoreCard } from "./ScoreCard";

const LEVEL_STYLE = {
  error: "border-rust-line bg-rust-tint text-rust-text",
  warning: "border-ochre-line bg-ochre-tint text-ochre-deep",
  info: "border-note-line bg-note-tint text-note-text",
} as const;
const LEVEL_TEXT = { error: "Could not read", warning: "Check this", info: "Note" } as const;

export function CandidateView({ r, role, total, uploaded = false }: { r: Result; role: Role; total: number; uploaded?: boolean }) {
  const order: Role[] = role === "uiux" ? ["uiux", "lca"] : ["lca", "uiux"];
  const lcaSkills = r.skills.filter((s) => s.role === "lca");
  const uxSkills = r.skills.filter((s) => s.role === "uiux");
  const reviewed = r.review.status !== "not reviewed";

  return (
    <div className="space-y-5">
      {/* Header */}
      <section className="anim-rise relative overflow-hidden rounded-[20px] border border-line bg-white p-6 sm:p-8">
        <svg viewBox="0 0 420 220" aria-hidden="true" className="pointer-events-none absolute -bottom-10 -right-8 hidden w-[420px] opacity-[0.08] sm:block">
          {[200, 160, 120, 80].map((rx) => <ellipse key={rx} cx="300" cy="170" rx={rx} ry={rx * 0.55} fill="none" stroke="#1E5B44" strokeWidth="1.4" />)}
        </svg>
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-4xl font-semibold leading-none tracking-[-0.02em] sm:text-[52px]">{r.id}</h1>
              <LabelBadge label={r.classification.label} size="md" />
              {reviewed && <span className="rounded-full bg-stone px-3 py-1.5 text-[13px] font-medium text-forest">✓ Checked by a person</span>}
            </div>
            <p className="mt-2.5 text-lg text-ink-2">{r.headline ?? "No headline found"}</p>
            <p className="mt-3.5 max-w-[640px] text-[15px] leading-relaxed text-ink-muted"><b className="text-ink">Why this label:</b> {r.classification.reason}</p>
          </div>
          {!uploaded && (
            <div className="flex flex-wrap gap-2.5">
              <a href={`/resumes/${encodeURIComponent(r.sourceFile)}`} download className={BTN.primary}>
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v8m0 0 3-3m-3 3L5 7M3 13h10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Open original resume
              </a>
              <a href={`#${order[1]}`} className={BTN.quiet}>See {order[1] === "lca" ? "LCA" : "UI/UX"} score</a>
            </div>
          )}
        </div>
        <div className="relative mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Total experience" value={r.experience.totalYears === null ? "unknown" : `${r.experience.totalYears}`} unit={r.experience.totalYears === null ? "" : "yrs"} />
          <Stat label="LCA experience" value={`${r.experience.relevantYears.lca ?? 0}`} unit="yrs" accent="text-forest" />
          <Stat label="Design experience" value={`${r.experience.relevantYears.uiux ?? 0}`} unit="yrs" accent="text-plum" />
          <Stat label="LCA projects" value={String(r.lcaProjectCount.count)} accent="text-forest" />
        </div>
        {r.experience.claimedEvidence && (
          <p className="relative mt-3 text-xs text-ink-subtle">The resume says “{r.experience.claimedEvidence}”. Years above come from job dates, overlaps counted once.</p>
        )}
      </section>

      {/* Scores */}
      <div className="grid gap-5 lg:grid-cols-2">
        {order.map((k, i) => <ScoreCard key={k} score={r.scores[k]} rank={r.rank[k]} of={total} delay={80 + i * 60} />)}
      </div>

      {/* Problems + review */}
      <div className={`grid gap-5 ${!uploaded ? "lg:grid-cols-2" : ""}`}>
        <Card>
          <h2 className="mb-3 font-display text-[22px] font-semibold">Data problems{r.flags.length ? ` (${r.flags.length})` : ""}</h2>
          {r.flags.length === 0
            ? <p className="text-sm text-ink-muted">None. Everything needed for scoring was found.</p>
            : (
              <ul className="space-y-2">
                {r.flags.map((f, i) => (
                  <li key={i} className={`rounded-xl border px-3.5 py-3 text-sm leading-relaxed ${LEVEL_STYLE[f.level]}`}>
                    <b>{LEVEL_TEXT[f.level]}:</b> {f.message}
                  </li>
                ))}
              </ul>
            )}
        </Card>
        {!uploaded && (
          <Card className={reviewed ? "border-forest-ring" : ""}>
            <h2 className="mb-3 font-display text-[22px] font-semibold">Human review</h2>
            {!reviewed ? (
              <p className="text-sm text-ink-muted">Not checked by a person yet (low priority: no warnings and not in the top 5).</p>
            ) : (
              <>
                <p className="text-[15px] font-semibold text-forest">
                  ✓ {r.review.status === "corrected" ? "Checked and corrected" : "Checked — extracted data matches the resume"}
                </p>
                {r.review.notes && <p className="mt-2 text-sm leading-relaxed text-ink-2">{r.review.notes}</p>}
                {r.review.changes.length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm text-ink-2">
                    {r.review.changes.map((c, i) => (
                      <li key={i}>Changed <code className="rounded bg-stone px-1.5 py-0.5 text-[13px]">{c.field}</code>: {String(c.from)} → <b>{String(c.to)}</b></li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </Card>
        )}
      </div>

      {/* Extracted information */}
      <h2 className="pt-3 font-display text-[30px] font-semibold">What we read from the resume</h2>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-base font-semibold">Work timeline ({r.jobs.length})</h3>
          {r.jobs.length === 0 && <p className="text-sm text-ink-muted">No jobs found.</p>}
          <ol className="relative space-y-5 border-l border-line pl-6">
            {r.jobs.map((j, i) => {
              const dot = j.relevantTo.includes("lca") ? "bg-forest shadow-[0_0_0_4px_#E8F1EC]" : j.relevantTo.includes("uiux") ? "bg-plum shadow-[0_0_0_4px_#EFEBFA]" : "bg-line-strong";
              return (
                <li key={i} className="relative">
                  <span aria-hidden="true" className={`absolute -left-[31px] top-1.5 h-3 w-3 rounded-full ${dot}`} />
                  <div className="font-semibold">{j.title}{j.company && <span className="font-normal text-ink-muted"> — {j.company}</span>}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[13px] text-ink-subtle">
                    <span>{j.dates.raw || "no dates"}{j.dates.months > 0 && ` · ${j.dates.months} months`}{j.isInternship && " · internship"}</span>
                    {j.relevantTo.includes("lca") && <Tag c="forest">LCA work</Tag>}
                    {j.relevantTo.includes("uiux") && <Tag c="plum">Design work</Tag>}
                    {!j.relevantTo.includes("lca") && j.sustainabilityRelated && <Tag c="stone">Sustainability</Tag>}
                  </div>
                  {j.bullets.length > 0 && (
                    <details className="mt-1.5">
                      <summary className="inline-flex min-h-[32px] items-center gap-1 text-[13px] font-medium text-ink-muted"><span className="caret">▸</span> Details</summary>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-[13px] leading-relaxed text-ink-2">{j.bullets.map((b, k) => <li key={k}>{b}</li>)}</ul>
                    </details>
                  )}
                </li>
              );
            })}
          </ol>
        </Card>

        <div className="space-y-5">
          <Card>
            <h3 className="mb-3 text-base font-semibold">Education</h3>
            {r.education.filter((e) => e.level !== "school").length === 0 && <p className="text-sm text-ink-muted">No degree found.</p>}
            <ul className="space-y-3">
              {r.education.filter((e) => e.level !== "school").map((e, i) => (
                <li key={i}>
                  <div className="font-semibold">{e.degree}</div>
                  <div className="text-[13px] text-ink-subtle">{[e.institution, e.endYear, e.ongoing ? "in progress" : null].filter(Boolean).join(" · ")}</div>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <h3 className="mb-3 text-base font-semibold">Projects ({r.projects.length})</h3>
            {r.projects.length === 0 && <p className="text-sm text-ink-muted">No projects section found.</p>}
            <ul className="space-y-2.5">
              {r.projects.map((p, i) => (
                <li key={i} className="rounded-xl border border-line-soft bg-soft px-3.5 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <b className="text-sm">{p.title}</b>
                    {p.relevantTo.includes("lca") && <Tag c="forest">LCA</Tag>}
                    {p.relevantTo.includes("uiux") && <Tag c="plum">Design</Tag>}
                  </div>
                  {p.description && <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{p.description.slice(0, 220)}{p.description.length > 220 ? "…" : ""}</p>}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <Card>
        <h3 className="mb-1 text-base font-semibold">Skills found</h3>
        <p className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-subtle">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px] bg-forest" /> Used in a job or project (full points)</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px] border border-[#B9D3C4] bg-forest-tint" /> Only listed (60%)</span>
        </p>
        <SkillRow title="LCA-related" skills={lcaSkills} c="forest" />
        <SkillRow title="Design-related" skills={uxSkills} c="plum" />
        {r.certifications.length > 0 && (
          <div className="mt-4 text-sm"><span className="font-semibold text-ink-2">Certifications: </span><span className="text-ink-muted">{r.certifications.join(" · ")}</span></div>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value, unit, accent = "text-ink" }: { label: string; value: string; unit?: string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-line-soft bg-soft px-4 py-3.5">
      <div className="text-xs text-ink-subtle">{label}</div>
      <div className={`font-display text-[26px] font-semibold ${accent}`}>{value}{unit && <span className="ml-1 font-sans text-sm font-normal text-ink-subtle">{unit}</span>}</div>
    </div>
  );
}

function Tag({ c, children }: { c: "forest" | "plum" | "stone"; children: React.ReactNode }) {
  const s = { forest: "bg-forest-tint text-forest", plum: "bg-plum-tint text-plum-text", stone: "bg-stone text-ink-muted" }[c];
  return <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${s}`}>{children}</span>;
}

function SkillRow({ title, skills, c }: { title: string; skills: Result["skills"]; c: "forest" | "plum" }) {
  const used = c === "forest" ? "bg-forest text-white" : "bg-plum text-white";
  const listed = c === "forest" ? "border border-[#B9D3C4] bg-forest-tint text-forest" : "border border-[#D2C7EE] bg-plum-tint text-plum-text";
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <span className="w-32 text-sm font-semibold text-ink-2">{title}</span>
      {skills.length === 0 && <span className="text-sm text-ink-subtle">none</span>}
      {skills.map((s) => (
        <span key={s.id} title={s.evidence[0]?.text} className={`rounded-full px-3 py-1.5 text-[13px] ${s.usedInWork ? used : listed}`}>{s.label}</span>
      ))}
    </div>
  );
}
