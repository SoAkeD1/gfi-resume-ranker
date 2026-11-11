// Score breakdown for one job: ring, each part as a bar, the "why", and proof quotes.
import type { RoleScore } from "@/lib/score";
import { ScoreBar, ScoreRing } from "./ui";

const ROLE_NAME = { lca: "LCA Consultant", uiux: "UI/UX Design Intern" } as const;
const ROLE_INK = { lca: "text-forest", uiux: "text-plum" } as const;

export function ScoreCard({ score, rank, of, delay = 0 }: { score: RoleScore; rank?: number; of?: number; delay?: number }) {
  const role = score.role;
  return (
    <section id={role} className="anim-rise rounded-[20px] border border-line bg-white p-6" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.08em] ${ROLE_INK[role]}`}>Score for</p>
          <h2 className="mt-0.5 font-display text-[26px] font-semibold">{ROLE_NAME[role]}</h2>
          {rank !== undefined && <p className="mt-1.5 text-sm text-ink-muted">Rank <b className="text-ink">#{rank}</b>{of ? ` of ${of}` : ""}</p>}
        </div>
        <ScoreRing value={score.total} role={role} />
      </div>

      {score.missingMustHaves.length > 0 && (
        <p className="mt-3.5 rounded-[10px] bg-rust-tint px-3 py-2.5 text-sm text-rust-text">
          Missing must-have: {score.missingMustHaves.join(", ")}
        </p>
      )}

      <div className="mt-5 space-y-5">
        {score.parts.map((p, i) => {
          // Some evidence already arrives wrapped in “ ”, and two skills can quote the same line: tidy both.
          const proof = Array.from(new Set(p.evidence.filter(Boolean).map((e) => e.replace(/^[“"]+|[”"]+$/g, "").trim())));
          return (
            <div key={p.key}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[15px] font-semibold">{p.label}</span>
                <span className="font-display text-lg font-semibold tabular-nums">{p.points}<span className="font-sans text-[13px] font-normal text-ink-subtle"> / {p.max}</span></span>
              </div>
              <div className="mt-2"><ScoreBar value={p.points} max={p.max} role={role} delay={200 + i * 90} barClass="flex-1" showValue={false} /></div>
              <ul className="mt-2.5 list-disc space-y-0.5 pl-[18px] text-sm leading-relaxed text-ink-2">
                {p.reasons.map((r, k) => <li key={k}>{r}</li>)}
              </ul>
              {proof.length > 0 && (
                <details className="mt-1.5">
                  <summary className={`inline-flex min-h-[36px] items-center gap-1.5 text-sm font-semibold ${ROLE_INK[role]}`}>
                    <span className="caret">▸</span> Show proof from the resume ({proof.length})
                  </summary>
                  <div className="mt-2 space-y-2">
                    {proof.map((e, k) => (
                      <blockquote key={k} className="quote-hl rounded-xl bg-soft px-4 py-3 font-display text-[15px] italic leading-relaxed text-[#22302A]">“{e}”</blockquote>
                    ))}
                  </div>
                </details>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
