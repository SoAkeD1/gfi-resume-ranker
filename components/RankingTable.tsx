"use client";
// Ranked list for one job, with plain-language sort + filter controls.
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Row } from "@/lib/types";
import type { Role } from "@/lib/skills";
import type { Label } from "@/lib/classify";
import { BTN, FlagIcon, LABEL_TEXT, LabelBadge, RankMark, ReviewedTick, ScoreBar } from "./ui";

type SortKey = "score" | "years";
const LABELS: Label[] = ["LCA", "UI/UX", "Both", "Neither", "Uncertain"];
const CHIP_ON: Record<Label, string> = {
  LCA: "border-forest bg-forest-tint text-forest ring-[3px] ring-forest-tint",
  "UI/UX": "border-plum-text bg-plum-tint text-plum-text ring-[3px] ring-plum-tint",
  Both: "border-note-text bg-note-tint text-note-text ring-[3px] ring-note-tint",
  Neither: "border-ink-muted bg-line-soft text-ink-muted ring-[3px] ring-line-soft",
  Uncertain: "border-ochre bg-ochre-tint text-ochre ring-[3px] ring-ochre-tint",
};
const FIELD = "h-11 rounded-[10px] border border-line-strong bg-soft px-3.5 text-sm font-normal text-ink focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest-tint";

export function RankingTable({ rows, role }: { rows: Row[]; role: Role }) {
  const router = useRouter();
  const [sort, setSort] = useState<SortKey>("score");
  const [minScore, setMinScore] = useState(0);
  const [minYears, setMinYears] = useState(0);
  const [labels, setLabels] = useState<Label[]>([]);
  const [onlyProblems, setOnlyProblems] = useState(false);
  const [query, setQuery] = useState("");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => r.score[role] >= minScore && r.years[role] >= minYears)
      .filter((r) => !labels.length || labels.includes(r.label))
      .filter((r) => !onlyProblems || r.problems > 0)
      .filter((r) => !q || r.id.toLowerCase().includes(q) || (r.headline ?? "").toLowerCase().includes(q))
      .sort((a, b) => sort === "score"
        ? a.rank[role] - b.rank[role]
        : b.years[role] - a.years[role] || a.rank[role] - b.rank[role]);
  }, [rows, role, sort, minScore, minYears, labels, onlyProblems, query]);

  const toggleLabel = (l: Label) => setLabels((x) => (x.includes(l) ? x.filter((y) => y !== l) : [...x, l]));
  const reset = () => { setMinScore(0); setMinYears(0); setLabels([]); setOnlyProblems(false); setQuery(""); setSort("score"); };
  const yearsLabel = role === "lca" ? "LCA experience" : "Design experience";
  const filtersOn = labels.length + (onlyProblems ? 1 : 0) + (minScore ? 1 : 0) + (minYears ? 1 : 0) + (query ? 1 : 0);
  // Stagger the entrance only for the first rows so long lists don't wait.
  const delay = (i: number) => `${Math.min(i, 12) * 40}ms`;

  return (
    <div>
      {/* Filters */}
      <section aria-label="Filters" className="mb-4 flex flex-col gap-4 rounded-2xl border border-line bg-white px-5 py-[18px]">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
          <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-2">Search
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ID or job title" className={`${FIELD} w-56`} />
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-2">Sort by
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={FIELD}>
              <option value="score">Best match first</option>
              <option value="years">Most {yearsLabel.toLowerCase()} first</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-2">
            <span>Minimum score · <span className="font-display text-base text-forest">{minScore}</span></span>
            <input type="range" min={0} max={90} step={5} value={minScore} onChange={(e) => setMinScore(+e.target.value)} className="h-11 w-44" />
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-2">
            <span>Minimum experience · <span className="font-display text-base text-forest">{minYears} yrs</span></span>
            <input type="range" min={0} max={6} step={0.5} value={minYears} onChange={(e) => setMinYears(+e.target.value)} className="h-11 w-44" />
          </label>
          <div className="hidden flex-1 lg:block" />
          <button type="button" role="switch" aria-checked={onlyProblems} onClick={() => setOnlyProblems((v) => !v)}
            className="flex min-h-[44px] items-center gap-2.5 text-sm text-ink-2">
            <span className={`relative inline-block h-6 w-[42px] rounded-full transition-colors ${onlyProblems ? "bg-forest" : "bg-line-strong"}`}>
              <span className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow transition-[left] ${onlyProblems ? "left-[21px]" : "left-[3px]"}`} />
            </span>
            Only resumes with problems
          </button>
          <button type="button" onClick={reset} disabled={!filtersOn} className={`${BTN.quiet} rounded-[10px] px-4 disabled:opacity-50`}>Reset</button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[13px] font-medium text-ink-2">Show</span>
          {LABELS.map((l) => {
            const on = labels.includes(l);
            return (
              <button key={l} type="button" onClick={() => toggleLabel(l)} aria-pressed={on}
                className={`min-h-[36px] rounded-full border px-3.5 text-[13px] font-semibold transition ${on ? CHIP_ON[l] : "border-line bg-white text-ink-muted hover:border-line-strong"}`}>
                {LABEL_TEXT[l]}
              </button>
            );
          })}
        </div>
      </section>

      <p className="mb-2.5 text-sm text-ink-muted">Showing <b className="text-ink">{shown.length}</b> of {rows.length} · click a row to see why it got its score</p>

      {/* Table (desktop) */}
      <div className="hidden overflow-hidden rounded-2xl border border-line bg-white md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-sm">
            <thead>
              <tr className="bg-soft text-left text-xs uppercase tracking-[0.06em] text-ink-subtle">
                <th className="px-5 py-3.5 font-semibold">Rank</th>
                <th className="px-3 py-3.5 font-semibold">Candidate</th>
                <th className="px-3 py-3.5 font-semibold">Match score</th>
                <th className="px-3 py-3.5 font-semibold">Best fit</th>
                <th className="px-3 py-3.5 font-semibold">{yearsLabel}</th>
                <th className="px-3 py-3.5 font-semibold">Top skills</th>
                <th className="px-5 py-3.5 font-semibold">Checks</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r, i) => (
                <tr key={r.id} onClick={() => router.push(`/candidate/${r.id}?role=${role}`)}
                  className="anim-rise group cursor-pointer border-t border-line-soft transition-colors hover:bg-[#F2F6F3]" style={{ animationDelay: delay(i) }}>
                  <td className="px-5 py-4"><RankMark rank={r.rank[role]} /></td>
                  <td className="px-3 py-4">
                    <Link href={`/candidate/${r.id}?role=${role}`} onClick={(e) => e.stopPropagation()} className="font-semibold text-ink group-hover:text-forest group-hover:underline">{r.id}</Link>
                    <div className="mt-0.5 max-w-[240px] truncate text-[13px] text-ink-subtle">{r.headline ?? "—"}</div>
                  </td>
                  <td className="px-3 py-4"><ScoreBar value={r.score[role]} role={role} delay={120 + Math.min(i, 12) * 40} barClass="w-[140px]" showMax={false} /></td>
                  <td className="px-3 py-4"><LabelBadge label={r.label} /></td>
                  <td className="px-3 py-4 tabular-nums text-ink-2">{r.years[role]} yrs</td>
                  <td className="px-3 py-4">
                    <div className="flex flex-wrap gap-1">
                      {r.topSkills[role].length
                        ? r.topSkills[role].map((s) => <span key={s} className="rounded-md bg-stone px-2 py-0.5 text-xs text-ink-2">{s}</span>)
                        : <span className="text-xs text-ink-subtle">none found</span>}
                    </div>
                    {r.missingMustHaves[role].length > 0 && r.score[role] >= 30 && (
                      <div className="mt-1.5 text-xs text-rust">Missing: {r.missingMustHaves[role].join(", ")}</div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <span className="flex items-center gap-3"><FlagIcon count={r.problems} error={r.hasError} /><ReviewedTick reviewed={r.reviewed} /></span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!shown.length && <Empty onReset={reset} />}
      </div>

      {/* Cards (phones) */}
      <div className="space-y-2.5 md:hidden">
        {shown.map((r, i) => (
          <Link key={r.id} href={`/candidate/${r.id}?role=${role}`} className="anim-rise block rounded-[18px] border border-line bg-white p-4" style={{ animationDelay: delay(i) }}>
            <div className="flex items-center gap-3">
              <RankMark rank={r.rank[role]} size={38} />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-ink">{r.id}</div>
                <div className="truncate text-[13px] text-ink-subtle">{r.headline}</div>
              </div>
              <LabelBadge label={r.label} />
            </div>
            <div className="mt-3"><ScoreBar value={r.score[role]} role={role} delay={120 + Math.min(i, 12) * 40} barClass="flex-1" showMax={false} /></div>
            <div className="mt-2 flex justify-between text-[13px] text-ink-subtle">
              <span>{r.years[role]} yrs {yearsLabel.toLowerCase()}</span>
              <span className="flex items-center gap-3"><FlagIcon count={r.problems} error={r.hasError} /><ReviewedTick reviewed={r.reviewed} /></span>
            </div>
          </Link>
        ))}
        {!shown.length && <div className="rounded-[18px] border border-line bg-white"><Empty onReset={reset} /></div>}
      </div>
    </div>
  );
}

function Empty({ onReset }: { onReset: () => void }) {
  return (
    <div className="px-6 py-14 text-center">
      <svg width="120" height="60" viewBox="0 0 120 60" aria-hidden="true" className="anim-drift mx-auto opacity-40">
        <path d="M5 45 C30 15 60 55 85 25 S115 15 118 20" fill="none" stroke="#1E5B44" strokeWidth="1.5" />
        <path d="M5 55 C30 25 60 65 85 35 S115 25 118 30" fill="none" stroke="#1E5B44" strokeWidth="1.5" />
      </svg>
      <p className="mt-3 font-display text-[22px] font-semibold">No resumes match these filters</p>
      <p className="mt-1 text-sm text-ink-muted">Try a lower minimum score, or show every label.</p>
      <button type="button" onClick={onReset} className={`${BTN.secondary} mt-4`}>Reset filters</button>
    </div>
  );
}
