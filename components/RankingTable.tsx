"use client";
// Ranked list for one role, with plain-language sort + filter controls.
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Row } from "@/lib/types";
import type { Role } from "@/lib/skills";
import type { Label } from "@/lib/classify";
import { FlagIcon, LabelBadge, ReviewedTick, ScoreBar } from "./ui";

type SortKey = "score" | "years";
const LABELS: Label[] = ["LCA", "UI/UX", "Both", "Neither", "Uncertain"];

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

  return (
    <div>
      {/* Controls */}
      <div className="mb-4 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_auto]">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Search</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ID or job title"
              className="w-44 rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Sort by</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm">
              <option value="score">Best match first</option>
              <option value="years">Most {yearsLabel.toLowerCase()} first</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Minimum score: <b>{minScore}</b></span>
            <input type="range" min={0} max={90} step={5} value={minScore} onChange={(e) => setMinScore(+e.target.value)} className="w-40 accent-emerald-600" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Minimum experience: <b>{minYears} yrs</b></span>
            <input type="range" min={0} max={6} step={0.5} value={minYears} onChange={(e) => setMinYears(+e.target.value)} className="w-40 accent-emerald-600" />
          </label>
        </div>
        <div className="flex flex-wrap items-end gap-2 md:justify-end">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={onlyProblems} onChange={(e) => setOnlyProblems(e.target.checked)} className="h-4 w-4 accent-amber-500" />
            Only show resumes with problems
          </label>
          <button onClick={reset} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">Reset</button>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:col-span-2">
          <span className="text-sm font-medium text-slate-700">Show:</span>
          {LABELS.map((l) => (
            <button key={l} onClick={() => toggleLabel(l)} aria-pressed={labels.includes(l)}
              className={`rounded-full transition ${labels.length && !labels.includes(l) ? "opacity-40" : ""} ${labels.includes(l) ? "ring-2 ring-slate-400" : ""}`}>
              <LabelBadge label={l} />
            </button>
          ))}
          {labels.length > 0 && <button onClick={() => setLabels([])} className="text-xs text-slate-500 underline">all</button>}
        </div>
      </div>

      <p className="mb-2 text-sm text-slate-500">Showing {shown.length} of {rows.length} resumes. Click a row to see why it got its score.</p>

      {/* Table (desktop) */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white md:block">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Candidate</th>
              <th className="px-4 py-3">Match score</th>
              <th className="px-4 py-3">Best fit</th>
              <th className="px-4 py-3">{yearsLabel}</th>
              <th className="px-4 py-3">Top matching skills</th>
              <th className="px-4 py-3">Problems</th>
              <th className="px-4 py-3">Checked</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shown.map((r) => (
              <tr key={r.id} onClick={() => router.push(`/candidate/${r.id}?role=${role}`)} className="group cursor-pointer hover:bg-emerald-50/40">
                <td className="px-4 py-3 font-semibold tabular-nums text-slate-900">#{r.rank[role]}</td>
                <td className="px-4 py-3">
                  <Link href={`/candidate/${r.id}?role=${role}`} className="font-medium text-slate-900 group-hover:text-emerald-700 group-hover:underline">{r.id}</Link>
                  <div className="max-w-[220px] truncate text-xs text-slate-500">{r.headline ?? "—"}</div>
                </td>
                <td className="px-4 py-3"><ScoreBar value={r.score[role]} /></td>
                <td className="px-4 py-3"><LabelBadge label={r.label} /></td>
                <td className="px-4 py-3 tabular-nums text-slate-700">{r.years[role]} yrs</td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {r.topSkills[role].length ? r.topSkills[role].join(", ") : <span className="text-slate-400">none found</span>}
                  {r.missingMustHaves[role].length > 0 && r.score[role] >= 30 && (
                    <div className="mt-0.5 text-red-600">Missing: {r.missingMustHaves[role].join(", ")}</div>
                  )}
                </td>
                <td className="px-4 py-3"><FlagIcon count={r.problems} error={r.hasError} /></td>
                <td className="px-4 py-3"><ReviewedTick reviewed={r.reviewed} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!shown.length && <Empty onReset={reset} />}
      </div>

      {/* Cards (mobile) */}
      <div className="space-y-2 md:hidden">
        {shown.map((r) => (
          <Link key={r.id} href={`/candidate/${r.id}?role=${role}`} className="block rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold">#{r.rank[role]} · {r.id}</span>
              <LabelBadge label={r.label} />
            </div>
            <div className="mt-1 truncate text-xs text-slate-500">{r.headline}</div>
            <div className="mt-2"><ScoreBar value={r.score[role]} wide /></div>
            <div className="mt-1 flex justify-between text-xs text-slate-500">
              <span>{r.years[role]} yrs {yearsLabel.toLowerCase()}</span>
              <FlagIcon count={r.problems} error={r.hasError} />
            </div>
          </Link>
        ))}
        {!shown.length && <Empty onReset={reset} />}
      </div>
    </div>
  );
}

function Empty({ onReset }: { onReset: () => void }) {
  return (
    <div className="p-8 text-center text-sm text-slate-500">
      No resumes match these filters. <button onClick={onReset} className="text-emerald-700 underline">Reset filters</button>
    </div>
  );
}
