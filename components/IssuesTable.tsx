"use client";
// Every data warning, filterable by type.
import Link from "next/link";
import { useState } from "react";

export type IssueLevel = "error" | "warning" | "info";
export interface IssueRow { id: string; level: IssueLevel; message: string; note: string | null }

const TEXT: Record<IssueLevel, string> = { error: "Could not read", warning: "Check this", info: "Note" };
const PILL: Record<IssueLevel, string> = {
  error: "bg-rust-tint text-rust-text",
  warning: "bg-ochre-tint text-ochre-deep",
  info: "bg-note-tint text-note-text",
};
const CHIP: Record<IssueLevel, string> = {
  error: "border-rust-line bg-rust-tint text-rust-text",
  warning: "border-ochre-line bg-ochre-tint text-ochre-deep",
  info: "border-note-line bg-note-tint text-note-text",
};

export function IssuesTable({ rows }: { rows: IssueRow[] }) {
  const [level, setLevel] = useState<IssueLevel | "all">("all");
  const shown = level === "all" ? rows : rows.filter((r) => r.level === level);
  const n = (l: IssueLevel) => rows.filter((r) => r.level === l).length;

  return (
    <section aria-label="All warnings">
      <div role="group" aria-label="Filter by type" className="mb-3 flex flex-wrap gap-2">
        <button type="button" aria-pressed={level === "all"} onClick={() => setLevel("all")}
          className={`min-h-[40px] rounded-full border px-3.5 text-[13px] font-semibold transition ${level === "all" ? "border-ink bg-ink text-white" : "border-line bg-white text-ink-muted hover:border-line-strong"}`}>
          All · {rows.length}
        </button>
        {(["error", "warning", "info"] as IssueLevel[]).map((l) => (
          <button key={l} type="button" aria-pressed={level === l} onClick={() => setLevel(level === l ? "all" : l)}
            className={`min-h-[40px] rounded-full border px-3.5 text-[13px] font-semibold transition ${CHIP[l]} ${level === l ? "ring-2 ring-offset-1 ring-ink/30" : level !== "all" ? "opacity-50" : ""}`}>
            {TEXT[l]} · {n(l)}
          </button>
        ))}
      </div>
      <div className="overflow-hidden rounded-[20px] border border-line bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead>
              <tr className="bg-soft text-left text-xs uppercase tracking-[0.06em] text-ink-subtle">
                <th className="px-5 py-3.5 font-semibold">Type</th>
                <th className="px-3 py-3.5 font-semibold">Candidate</th>
                <th className="px-3 py-3.5 font-semibold">What&apos;s wrong</th>
                <th className="px-5 py-3.5 font-semibold">Reviewer note</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r, i) => (
                <tr key={`${r.id}-${i}`} className="border-t border-line-soft align-top transition-colors hover:bg-soft">
                  <td className="px-5 py-3.5"><span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${PILL[r.level]}`}>{TEXT[r.level]}</span></td>
                  <td className="px-3 py-3.5"><Link href={`/candidate/${r.id}`} className="font-semibold text-forest hover:underline">{r.id}</Link></td>
                  <td className="px-3 py-3.5 leading-relaxed text-ink-2">{r.message}</td>
                  <td className="px-5 py-3.5 text-[13px] leading-relaxed text-ink-subtle">{r.note ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
