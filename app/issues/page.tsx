import Link from "next/link";
import { RESULTS } from "@/lib/data";
import { Card, LabelBadge } from "@/components/ui";

export const metadata = { title: "Problems — Resume Ranker" };

const ORDER = { error: 0, warning: 1, info: 2 } as const;
const TEXT = { error: "Could not read", warning: "Check this", info: "Note" } as const;
const STYLE = { error: "bg-red-100 text-red-800", warning: "bg-amber-100 text-amber-900", info: "bg-sky-100 text-sky-900" } as const;

export default function IssuesPage() {
  const items = RESULTS.flatMap((r) => r.flags.map((f) => ({ r, f })))
    .sort((a, b) => ORDER[a.f.level] - ORDER[b.f.level] || a.r.id.localeCompare(b.r.id));
  const uncertain = RESULTS.filter((r) => r.classification.label === "Uncertain");
  const n = (l: keyof typeof ORDER) => items.filter((x) => x.f.level === l).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Problems found</h1>
        <p className="mt-1 text-sm text-slate-600">
          Things the system could not read or was unsure about. We never guess missing information — it is flagged here instead,
          so a person can open the original resume and decide.
        </p>
        <div className="mt-3 flex gap-2 text-xs">
          <span className={`rounded px-2 py-1 ${STYLE.error}`}>{n("error")} could not read</span>
          <span className={`rounded px-2 py-1 ${STYLE.warning}`}>{n("warning")} to check</span>
          <span className={`rounded px-2 py-1 ${STYLE.info}`}>{n("info")} notes</span>
        </div>
      </div>

      <Card>
        <h2 className="mb-1 font-semibold">Resumes that need a person to decide ({uncertain.length})</h2>
        <p className="mb-3 text-sm text-slate-500">The system labelled these “Needs a look” because the scores are close to the line or the data is incomplete.</p>
        <ul className="divide-y divide-slate-100">
          {uncertain.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
              <Link href={`/candidate/${r.id}`} className="w-28 font-medium text-emerald-700 hover:underline">{r.id}</Link>
              <LabelBadge label={r.classification.label} />
              <span className="flex-1 text-slate-600">{r.classification.reason}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr><th className="px-4 py-3">Type</th><th className="px-4 py-3">Candidate</th><th className="px-4 py-3">What is wrong</th><th className="px-4 py-3">Reviewer note</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map(({ r, f }, i) => (
              <tr key={i} className="align-top">
                <td className="px-4 py-2.5"><span className={`whitespace-nowrap rounded px-2 py-0.5 text-xs ${STYLE[f.level]}`}>{TEXT[f.level]}</span></td>
                <td className="px-4 py-2.5"><Link href={`/candidate/${r.id}`} className="font-medium text-emerald-700 hover:underline">{r.id}</Link></td>
                <td className="px-4 py-2.5 text-slate-700">{f.message}</td>
                <td className="px-4 py-2.5 text-xs text-slate-500">{r.review.notes ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
