import Link from "next/link";
import { RESULTS } from "@/lib/data";
import { IssuesTable, type IssueRow } from "@/components/IssuesTable";

export const metadata = { title: "Problems — Resume Ranker" };

const ORDER = { error: 0, warning: 1, info: 2 } as const;

export default function IssuesPage() {
  const rows: IssueRow[] = RESULTS.flatMap((r) => r.flags.map((f) => ({ id: r.id, level: f.level, message: f.message, note: r.review.notes })))
    .sort((a, b) => ORDER[a.level] - ORDER[b.level] || a.id.localeCompare(b.id));
  const uncertain = RESULTS.filter((r) => r.classification.label === "Uncertain")
    .sort((a, b) => (a.flags.some((f) => f.level === "error") ? -1 : 0) - (b.flags.some((f) => f.level === "error") ? -1 : 0));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl font-semibold tracking-[-0.02em] sm:text-[44px]">Problems found</h1>
        <p className="mt-2.5 max-w-[660px] text-base leading-relaxed text-ink-muted">
          Things the system couldn&apos;t read or wasn&apos;t sure about. Missing facts are never guessed; they&apos;re listed here so a person can open the original and decide.
        </p>
      </div>

      <section>
        <h2 className="font-display text-[26px] font-semibold">Needs a person to decide</h2>
        <p className="mb-4 mt-1 text-sm text-ink-subtle">{uncertain.length} resumes. The scores are close to the line or the data is incomplete.</p>
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
          {uncertain.map((r, i) => (
            <Link key={r.id} href={`/candidate/${r.id}`} style={{ animationDelay: `${i * 60}ms` }}
              className="anim-rise flex min-h-[190px] flex-col rounded-[18px] border border-ochre-line bg-white p-[18px] transition duration-200 hover:-translate-y-0.5 hover:shadow-soft">
              <div className="flex flex-col items-start gap-1.5">
                <span className="whitespace-nowrap font-display text-xl font-semibold text-ink">{r.id}</span>
                <span className="rounded-full bg-ochre-tint px-2 py-1 text-xs font-semibold text-ochre">Needs a look</span>
              </div>
              <div className="mt-2 text-[13px] text-ink-subtle">LCA {r.scores.lca.total} · UI/UX {r.scores.uiux.total}</div>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-2">{r.classification.reason}</p>
              <span className="mt-auto pt-3 text-[13px] font-semibold text-forest">Open candidate <span className="arrow">→</span></span>
            </Link>
          ))}
        </div>
      </section>

      <IssuesTable rows={rows} />
    </div>
  );
}
