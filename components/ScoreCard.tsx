// Score breakdown for one role: total, each part as a bar, and the "why" with quotes.
import type { RoleScore } from "@/lib/score";
import { Card, ScoreBar } from "./ui";

const ROLE_NAME = { lca: "LCA Consultant", uiux: "UI/UX Design Intern" } as const;

export function ScoreCard({ score, rank, of }: { score: RoleScore; rank?: number; of?: number }) {
  return (
    <Card>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-900">{ROLE_NAME[score.role]}</h3>
        {rank !== undefined && <span className="text-sm text-slate-500">Rank <b className="text-slate-900">#{rank}</b>{of ? ` of ${of}` : ""}</span>}
      </div>
      <div className="mt-3"><ScoreBar value={score.total} wide /></div>

      {score.missingMustHaves.length > 0 && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Missing must-have: {score.missingMustHaves.join(", ")}
        </p>
      )}

      <div className="mt-4 space-y-4">
        {score.parts.map((p) => (
          <div key={p.key}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-700">{p.label}</span>
              <div className="w-48"><ScoreBar value={p.points} max={p.max} wide /></div>
            </div>
            <ul className="mt-1.5 space-y-0.5 text-sm text-slate-600">
              {p.reasons.map((r, i) => <li key={i} className="flex gap-1.5"><span className="text-slate-400">•</span><span>{r}</span></li>)}
            </ul>
            {p.evidence.filter(Boolean).length > 0 && (
              <details className="mt-1.5 text-sm">
                <summary className="cursor-pointer text-slate-500 hover:text-slate-800">Show proof from the resume ({p.evidence.filter(Boolean).length})</summary>
                <ul className="mt-1 space-y-1 border-l-2 border-slate-200 pl-3 italic text-slate-600">
                  {p.evidence.filter(Boolean).map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </details>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
