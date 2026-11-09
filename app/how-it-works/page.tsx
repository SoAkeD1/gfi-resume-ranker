import { JOBS } from "@/config/jobs";
import { SKILLS } from "@/lib/skills";
import { RESULTS } from "@/lib/data";
import { THRESHOLD, MARGIN } from "@/lib/classify";
import { Card } from "@/components/ui";

export const metadata = { title: "How scoring works — Resume Ranker" };

const PARTS = {
  lca: [
    ["Skills match", 40, "Must-haves (LCA, GaBi or SimaPro, LCI data work) make up 60%; bonus skills such as EPD, openLCA, ecoinvent and carbon footprinting make up 40%. A skill used in a real job or project counts fully; one that is only listed counts 60%."],
    ["Relevant experience", 25, `Years in jobs that mention LCA work count fully. Years in other sustainability work (ESG, GHG, carbon) count half. Full marks for ${JOBS.lca.experience.min}–${JOBS.lca.experience.max} years; fewer years scale down; more than ${JOBS.lca.experience.max} gives slightly less.`],
    ["LCA projects", 20, "The job asks for at least 3 completed LCA projects. We count LCA projects, jobs with LCA work, and stated numbers such as “40 EPDs”. 3 or more = full marks."],
    ["Education", 15, "Master’s/PhD 10, Bachelor’s 8, Diploma 5, plus 5 for an environmental or engineering field."],
  ],
  uiux: [
    ["Skills match", 40, "Must-haves (Figma, prototyping, user research or user psychology, UI/UX design principles) make up 60%; bonus skills such as wireframing, user flows, design systems and accessibility make up 40%. Used in work = full, only listed = 60%."],
    ["Design projects & portfolio", 40, "8 points for each design project or design job (up to 4), plus 8 if a portfolio is mentioned. The job is about producing work (the first 90 days are a website revamp and a job board), so shown work counts as much as skills."],
    ["Experience fit (0–1 yr)", 15, "It is an internship: up to 1.5 years of design work is ideal (15). No design work yet but a design background: 9. 1.5–3 years: 12. More than 3 years: 8 (likely over-qualified)."],
    ["Education", 5, "The job description does not ask for a degree, so education counts only a little: any degree 2 (Bachelor's in progress included), plus 3 for a design, HCI, mass/visual communication or related field. On an equal total score, the higher degree ranks first."],
  ],
} as const;

export default function HowItWorks() {
  const reviewed = RESULTS.filter((r) => r.review.status !== "not reviewed").length;
  const corrected = RESULTS.filter((r) => r.review.status === "corrected").length;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">How scoring works</h1>
        <p className="mt-1 text-slate-600">
          Every resume gets two scores out of 100 — one for each job. The score is the sum of four parts, and every point comes with
          a written reason and a quote from the resume. There is no hidden AI judgement: the same rules apply to everyone.
        </p>
      </div>

      <Card>
        <h2 className="mb-2 font-semibold">The 4 steps</h2>
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-700">
          <li><b>Read</b> the resume (Word or PDF) and split it into sections: experience, education, projects, skills.</li>
          <li><b>Extract</b> jobs with dates, skills (from a list of {SKILLS.length} skills and their spellings), degrees and projects. Missing or unclear information is <b>flagged, never guessed</b>.</li>
          <li><b>Check by hand</b>: a person compared the extracted data with the original resumes — {reviewed} of {RESULTS.length} checked, {corrected} corrected, all notes saved.</li>
          <li><b>Score and rank</b> each resume for each job using the rules below.</li>
        </ol>
      </Card>

      {(["lca", "uiux"] as const).map((role) => (
        <Card key={role}>
          <h2 className="font-semibold">{JOBS[role].title}</h2>
          <p className="mb-3 text-sm text-slate-500">{JOBS[role].summary}</p>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {PARTS[role].map(([name, pts, how]) => (
                <tr key={name} className="align-top">
                  <td className="w-44 py-2 pr-3 font-medium text-slate-800">{name}</td>
                  <td className="w-16 py-2 pr-3 tabular-nums text-slate-900">{pts} pts</td>
                  <td className="py-2 text-slate-600">{how}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {role === "lca" && JOBS.lca.experience.note && <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900">Note: {JOBS.lca.experience.note}</p>}
        </Card>
      ))}

      <Card>
        <h2 className="mb-2 font-semibold">Which job does a resume fit?</h2>
        <p className="mb-2 text-sm text-slate-600">Ranking: highest score first. If two scores are exactly equal, the higher degree comes first (PhD, then Master&apos;s, then Bachelor&apos;s), then more relevant experience. A degree never beats a higher score.</p>
        <ul className="space-y-1 text-sm text-slate-700">
          <li><b>Fits LCA / Fits UI/UX</b> — scores {THRESHOLD} or more for that job only.</li>
          <li><b>Fits both</b> — {THRESHOLD}+ for both jobs.</li>
          <li><b>Fits neither</b> — below {THRESHOLD} for both.</li>
          <li><b>Needs a look</b> — the file can’t be read, the scores are within {MARGIN} points of {THRESHOLD} with no clear winner, or the resume is too short to judge.</li>
        </ul>
      </Card>

      <Card>
        <h2 className="mb-2 font-semibold">Known limits</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>The anonymised resumes had some numbers removed (e.g. “ISO 14040” became “ISO /”). ISO 14040/14044 is therefore <b>not scored</b> for anyone — it would be unfair to some.</li>
          <li>Portfolio links were mostly removed by anonymisation, so the portfolio bonus is rarely given.</li>
          <li>Skill matching uses word patterns, so very unusual wording can be missed. The human check and the “proof” quotes are there to catch this.</li>
          <li>“Present” is treated as November 2026 so results are repeatable.</li>
        </ul>
      </Card>
    </div>
  );
}
