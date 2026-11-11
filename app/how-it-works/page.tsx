import { JOBS } from "@/config/jobs";
import { SKILLS } from "@/lib/skills";
import { RESULTS } from "@/lib/data";
import { THRESHOLD, MARGIN } from "@/lib/classify";
import { Contours, Eyebrow } from "@/components/ui";

export const metadata = { title: "How scoring works — Resume Ranker" };

type Part = { name: string; pts: number; rule: string };
const PARTS: Record<"lca" | "uiux", Part[]> = {
  lca: [
    { name: "Skills", pts: 40, rule: "Must-haves: LCA, GaBi or SimaPro, LCI data work. Used in a job or project counts fully; only listed counts 60%. Bonus skills such as EPD, openLCA and carbon footprint add the rest." },
    { name: "Experience", pts: 25, rule: `${JOBS.lca.experience.min}–${JOBS.lca.experience.max} years of LCA work = full marks; fewer scales down, more gives slightly less. Other sustainability years (ESG, GHG, carbon) count half.` },
    { name: "LCA projects", pts: 20, rule: "At least 3 completed LCA projects = full. A line like “Published 12 EPDs” counts too: each EPD is a finished LCA study." },
    { name: "Education", pts: 15, rule: "Master’s or PhD 10, Bachelor’s 8, Diploma 5, plus 5 for an environmental, energy or engineering field." },
  ],
  uiux: [
    { name: "Skills", pts: 40, rule: "Must-haves: Figma, prototyping, user research or user psychology, UI/UX basics. Used counts fully; listed 60%. Bonus: wireframing, user flows, design systems, accessibility." },
    { name: "Design work", pts: 40, rule: "8 points per design project or design job (up to 4), plus 8 for a portfolio. The first 90 days are a website revamp and a job board, so shown work counts as much as skills." },
    { name: "Experience fit", pts: 15, rule: "Up to 18 months of design work is ideal (15). No work yet but design studies: 9. 1.5–3 years: 12. Over 3 years: 8 — it is an internship." },
    { name: "Education", pts: 5, rule: "The job asks for no degree, so it counts a little: any degree 2, plus 3 for a design, HCI or communication-design field." },
  ],
};
const TONES = { lca: ["#1E5B44", "#5E957A", "#A9CBB8", "#DCEBE2"], uiux: ["#5A3EA6", "#8C76C9", "#C6BAE6", "#EAE5F7"] };

export default function HowItWorks() {
  const reviewed = RESULTS.filter((r) => r.review.status !== "not reviewed").length;
  const corrected = RESULTS.filter((r) => r.review.status === "corrected").length;
  const steps = [
    { t: "Read", d: "The Word or PDF file becomes text, split into sections: experience, education, projects, skills." },
    { t: "Extract", d: `Jobs with dates, skills (from a list of ${SKILLS.length} and their spellings), degrees and projects. Unclear facts are flagged, never guessed.` },
    { t: "Human check", d: `A person compared the data with the original resumes: ${reviewed} of ${RESULTS.length} checked, ${corrected} corrected, every change logged.` },
    { t: "Score & rank", d: "Four parts per job add up to 100. The list is sorted, and each score shows its proof." },
  ];

  return (
    <div className="mx-auto max-w-[1040px] space-y-10">
      <section className="relative">
        <Contours className="absolute -top-5 right-0 hidden w-[360px] opacity-10 md:block" />
        <Eyebrow>Plain English</Eyebrow>
        <h1 className="relative max-w-[680px] font-display text-4xl font-semibold leading-[1.05] tracking-[-0.02em] sm:text-[52px]">How every score is made</h1>
        <p className="relative mt-3.5 max-w-[640px] text-[17px] leading-relaxed text-ink-muted">
          Each resume gets two scores out of 100, one for each job. Every point comes with a written reason and a quote from the resume. There is no hidden AI judgement: the same rules apply to everyone.
        </p>
      </section>

      <ol aria-label="Four steps" className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.t} className="anim-rise rounded-[20px] border border-line bg-white p-[22px]" style={{ animationDelay: `${i * 80}ms` }}>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-forest-tint font-display text-lg font-semibold text-forest">{i + 1}</span>
            <h2 className="mb-1.5 mt-3.5 font-display text-[22px] font-semibold">{s.t}</h2>
            <p className="text-sm leading-relaxed text-ink-muted">{s.d}</p>
          </li>
        ))}
      </ol>

      {(["lca", "uiux"] as const).map((role) => (
        <section key={role} className="rounded-3xl border border-line bg-white p-6 sm:p-7">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-display text-[30px] font-semibold">{JOBS[role].title}</h2>
            <span className="text-sm text-ink-subtle">{role === "lca" ? `${JOBS.lca.experience.min}–${JOBS.lca.experience.max} years · sustainability consultancy` : "0–1 year · Growth For Impact"}</span>
          </div>
          <div role="img" aria-label={PARTS[role].map((p) => `${p.name} ${p.pts}`).join(", ")} className="mt-5 flex h-11 gap-[3px] overflow-hidden rounded-xl">
            {PARTS[role].map((p, i) => (
              <div key={p.name} className="anim-fill grid place-items-center font-display text-base font-semibold"
                style={{ flex: `${p.pts} 1 0`, background: TONES[role][i], color: i === 0 ? "#FFFFFF" : "#17201B", animationDelay: `${i * 120}ms` }}>
                {p.pts}
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PARTS[role].map((p, i) => (
              <div key={p.name}>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded" style={{ background: TONES[role][i] }} />
                  <span className="text-[15px] font-semibold">{p.name}</span>
                  <span className="ml-auto font-display text-lg font-semibold">{p.pts}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{p.rule}</p>
              </div>
            ))}
          </div>
          {role === "lca" && JOBS.lca.experience.note && (
            <p className="mt-5 rounded-xl bg-ochre-tint px-3.5 py-3 text-sm leading-relaxed text-ochre-deep">{JOBS.lca.experience.note}</p>
          )}
        </section>
      ))}

      <section className="rounded-3xl border border-line bg-white p-6 sm:p-7">
        <h2 className="font-display text-[30px] font-semibold">Which job does a resume fit?</h2>
        <p className="mb-7 mt-1.5 text-[15px] text-ink-muted">One line from 0 to 100. Where a score lands decides the label.</p>
        <div className="relative h-14" aria-hidden="true">
          <div className="absolute inset-x-0 top-[22px] h-3 rounded-full"
            style={{ background: `linear-gradient(90deg, #E4E1D8 0%, #E4E1D8 ${THRESHOLD - MARGIN}%, #F3D9A4 ${THRESHOLD - MARGIN}%, #F3D9A4 ${THRESHOLD + MARGIN}%, #BFD8C9 ${THRESHOLD + MARGIN}%, #BFD8C9 100%)` }} />
          <div className="absolute top-2.5 h-9 w-0.5 bg-ink" style={{ left: `${THRESHOLD}%` }} />
          <span className="absolute left-0 top-[46px] text-xs text-ink-subtle">0</span>
          <span className="absolute top-[46px] -translate-x-1/2 text-xs font-semibold" style={{ left: `${THRESHOLD}%` }}>{THRESHOLD}</span>
          <span className="absolute right-0 top-[46px] text-xs text-ink-subtle">100</span>
        </div>
        <div className="mt-7 grid gap-3.5 md:grid-cols-3">
          <div className="rounded-2xl bg-paper p-4"><span className="rounded-full bg-line-soft px-2.5 py-1 text-[13px] font-semibold text-ink-muted">Fits neither</span><p className="mt-2.5 text-sm text-ink-2">Below {THRESHOLD} for both jobs.</p></div>
          <div className="rounded-2xl bg-[#FDF7EA] p-4"><span className="rounded-full bg-ochre-tint px-2.5 py-1 text-[13px] font-semibold text-ochre">Needs a look</span><p className="mt-2.5 text-sm text-ink-2">Within {MARGIN} points of {THRESHOLD} with no clear winner, the file can&apos;t be read, or the resume is too short. A person decides.</p></div>
          <div className="rounded-2xl bg-forest-pale p-4"><span className="rounded-full bg-forest-tint px-2.5 py-1 text-[13px] font-semibold text-forest">Fits LCA / Fits UI/UX</span><p className="mt-2.5 text-sm text-ink-2">{THRESHOLD} or more for that job. {THRESHOLD}+ for both = “Fits both”.</p></div>
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-3xl border border-line bg-white p-6 sm:p-7">
          <h2 className="mb-4 font-display text-[26px] font-semibold">Order in the list</h2>
          <ol className="list-decimal space-y-1.5 pl-5 text-[15px] text-ink-2">
            <li>Higher score first</li>
            <li>Same score → higher degree first (PhD, Master&apos;s, Bachelor&apos;s)</li>
            <li>Still the same → more relevant experience</li>
          </ol>
          <p className="mt-3.5 text-sm text-ink-subtle">A degree never beats a higher score.</p>
        </section>
        <section className="rounded-3xl border border-dashed border-line-strong bg-soft p-6 sm:p-7">
          <h2 className="mb-4 font-display text-[26px] font-semibold">Known limits</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink-2">
            <li>ISO 14040/14044 is not scored: anonymisation removed the numbers (“ISO 14040” became “ISO /”).</li>
            <li>Portfolio links were mostly removed, so that bonus is rare.</li>
            <li>Unusual wording can be missed; the proof quotes and the human check are there to catch it.</li>
            <li>“Present” means November 2026, so results repeat.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
