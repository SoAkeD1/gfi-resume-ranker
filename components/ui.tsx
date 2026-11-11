// Small presentational pieces shared by every page (safe for server and client).
import type { Label } from "@/lib/classify";

const LABEL_STYLE: Record<Label, string> = {
  LCA: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  "UI/UX": "bg-violet-100 text-violet-800 ring-violet-200",
  Both: "bg-sky-100 text-sky-800 ring-sky-200",
  Neither: "bg-slate-100 text-slate-600 ring-slate-200",
  Uncertain: "bg-amber-100 text-amber-800 ring-amber-200",
};

export const LABEL_TEXT: Record<Label, string> = {
  LCA: "Fits LCA",
  "UI/UX": "Fits UI/UX",
  Both: "Fits both",
  Neither: "Fits neither",
  Uncertain: "Needs a look",
};

export function LabelBadge({ label }: { label: Label }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${LABEL_STYLE[label]}`}>
      {LABEL_TEXT[label]}
    </span>
  );
}

export function scoreColor(score: number) {
  return score >= 70 ? "bg-emerald-500" : score >= 50 ? "bg-lime-500" : score >= 30 ? "bg-amber-400" : "bg-slate-300";
}

/** Horizontal bar with the number beside it. */
export function ScoreBar({ value, max = 100, wide = false }: { value: number; max?: number; wide?: boolean }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="flex items-center gap-2">
      <div className={`h-2 ${wide ? "w-full" : "w-24"} overflow-hidden rounded-full bg-slate-100`} role="img" aria-label={`${value} out of ${max}`}>
        <div className={`h-full rounded-full ${scoreColor((value / max) * 100)}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-14 shrink-0 text-right text-sm tabular-nums font-semibold text-slate-800">
        {value}<span className="font-normal text-slate-400">/{max}</span>
      </span>
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</section>;
}

export function ReviewedTick({ reviewed }: { reviewed: boolean }) {
  return reviewed
    ? <span title="Extracted data checked by a human reviewer" className="text-xs text-emerald-700">✓ checked</span>
    : <span title="Not yet checked by a human" className="text-xs text-slate-400">—</span>;
}

export function FlagIcon({ count, error }: { count: number; error?: boolean }) {
  if (!count) return <span className="text-slate-300" aria-label="No problems">—</span>;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${error ? "text-red-600" : "text-amber-600"}`}
      title={`${count} data problem(s) — open the candidate to see them`}>
      ⚠ {count}
    </span>
  );
}
