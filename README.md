# Resume Ranker: LCA Consultant & UI/UX Design Intern

A prototype that reads 47 anonymised resumes, pulls out the job-relevant facts, checks them against two job descriptions, and ranks every candidate **separately for each role**. Every point it gives comes with a written reason and a quote from the resume. HR users can browse, filter and open candidates, see every data problem, and upload a new resume to see where it would rank.

Built by Shrimon Mishra for the Growth For Impact Software Engineer assignment.

- **Live prototype:** https://gfi-resume-ranker.vercel.app
- **Source code:** https://github.com/SoAkeD1/gfi-resume-ranker
- **Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · `mammoth` (Word) · `unpdf` (PDF) · Vitest. No database; free Vercel tier.

---

## 1. What it does

| Requirement | Where |
|---|---|
| Ingest the resumes and both JDs | `public/resumes/` (47 `.docx`), `config/jobs.ts` (JD1, JD2 as editable settings) |
| Extract skills, experience, education, projects and keywords; handle bad data; keep a link to the source | `lib/extract.ts`, `lib/dates.ts`, `lib/skills.ts` → `data/extracted.json` (each record keeps `sourceFile`) |
| Classify as LCA / UI/UX / Both / Neither / Uncertain | `lib/classify.ts` |
| Rank separately per role with a clear score and explanation | `lib/score.ts` → `data/results.json` |
| Review UI: both job lists, candidate detail, sort/filter, visible errors | `app/page.tsx`, `app/candidate/[id]`, `app/issues` |
| Upload a new resume and see its rank | `app/upload`, `app/api/rank/route.ts` |
| Simple for non-technical HR users | Plain-language labels ("Fits LCA", "Needs a look"), score bars, "Show proof from the resume" |

---

## 2. Data flow

```
 47 .docx resumes          JD1 + JD2 (config/jobs.ts)
        │                          │
        ▼                          │
 ① EXTRACT  npm run extract        │
   text (mammoth) → sections → jobs + dates, skills, education,
   projects, flags        → data/extracted.json
        │
        ▼
 ② HUMAN REVIEW  npm run review:export → data/review.csv (fix in Excel)
                 npm run review:apply  → data/verified.json + data/review-log.json
        │
        ▼
 ③ SCORE + ④ CLASSIFY + RANK   npm run score  ◄────────┘
        → data/results.json
        │
        ▼
 ⑤ WEB APP (Next.js, static pages)    + /api/rank: upload → same ①③④ code → rank vs the pile
```

`npm run pipeline` runs ①–④ in order. Human edits in `review.csv` are kept when the pipeline is re-run.

---

## 3. Extraction (step ①)

The extractor is **rule-based, not an LLM**. The same input always gives the same output, and every value can be traced back to a line in the resume.

1. **Read text:** Word files with `mammoth`. PDFs (uploads) with `unpdf`, where lines are rebuilt from each text item's vertical position.
2. **Split into sections** by heading: Experience, Projects, Education, Skills, Tools, Certifications, Summary, and so on. Several spellings of each are accepted.
3. **Jobs and dates.** Job lines look like `Title — Company   Date range`. A fallback pattern finds a date range at the end of a line for other layouts. The date parser (`lib/dates.ts`) handles about 15 formats:
   - `Jan 2019 – Present`, `Sept 2021 – Jun 2023`, `Sep ’25 – Dec ’25`, `Jan 26 - April 26`
   - `09/2023 – 09/2024`, `May – July 2025`, `2016 - 2019`, `8 Months`
   - `null` / `Not specified`, which is flagged, never guessed
4. **Years of experience** are merged across jobs, so **overlapping jobs count once**. "Present" = November 2026, a fixed date so results are repeatable. Future end dates are capped at today and flagged.
   - **Relevant years per role** count only jobs whose text contains that role's signal words.
   - **Sustainability years** (ESG, GHG, carbon, circular economy and so on) are tracked separately.
5. **Skills** come from a dictionary of 37 skills with synonyms (`lib/skills.ts`). Each match records:
   - whether it was **used in a job or project** or **only listed** in a skills section
   - up to 3 **quotes** as evidence
6. **LCA project count:** LCA projects, plus jobs with LCA work, plus stated numbers such as "Published 40 EPDs". The highest of these counts.
7. **Education:** degree level, field, institution and end year.
8. **Flags instead of guesses:** unreadable or empty file, missing or unclear dates, very short resume, no sections, claimed years that don't match the dates, numbers removed by anonymisation, and duplicates.

---

## 4. Human review (step ②): how the AI and rule output was verified

Extraction is never trusted blindly.

- `review.csv` lists all 47 resumes, sorted by risk:
  - **Priority 1:** errors or warnings.
  - **Priority 2:** suspicious patterns, for example "LCA mentioned but 0 LCA years" or "designer with no projects".
  - **Priority 3:** the rest.
- The reviewer compared each row with the original resume and either marked it `ok` or filled a correction column (`corrected_totalYears`, `corrected_lcaYears`, `corrected_uiuxYears`, `corrected_lcaProjects`, `add_skills`, `remove_skills`, `corrected_eduField`), plus a note.
- `apply-review.ts` merges the edits and writes `review-log.json`, which records **every change as old → new** with the reason. The website shows the review status and notes on every candidate page.

**Result:** **30 of 47 resumes were checked by hand.** That covers every flagged resume and the top 5 of both rankings. 27 matched the resume and 3 were corrected:

| Resume | Correction | Why |
|---|---|---|
| AK-4184 | removed "portfolio" and "responsive" (UI/UX) | They came from a personal HTML/CSS website in IT training: web coding, not design |
| BS-0461 | design years 0.8 → 1.0 | A product-design internship that built web interfaces wasn't recognised |
| SRK-4455 | LCA projects 2 → 3 | Has led LCAs for multiple global clients since 2022; the resume gives no number |

The review and later re-reads also found **10 extractor bugs**. Each was fixed in the rules for all resumes, not patched by hand. Bugs 1, 2, 4, 9 and 10 have regression tests:
1. A candidate with the initials "UI" was given a UI-design skill.
2. "MS Ramaiah University" was read as an MS degree.
3. "Bachelor of Technology in CS" gave the field "Technology".
4. Job titles were cut at the dash inside "(UNDP - supported)".
5. "3+ years" was flagged when the dates showed more ("+" means at least).
6. The LCA software Air.e wasn't recognised.
7. Circular-economy work wasn't counted as sustainability.
8. "Electronics **Communication** Engineering" earned the UI/UX "design field" bonus. The field rule now needs "mass/visual/design communication".
9. Designers often describe projects by outcome ("truck aggregator app", "90% task success rate") without the words UI/UX/Figma, so 8 designers had design projects that weren't counted. For a clear designer profile (design headline or design degree), projects about apps, users, dashboards, interfaces or usability now count as design work. No non-designer's score changed.
10. "Madhyamik" (the class 10 board exam) was read as a Master's degree, because it starts with "ma". School words are now checked first.

**Ideal-candidate check.** An ideal resume was written straight from each JD and added as a test that must score exactly 100. An unrelated resume must score under 15. The check found a design flaw in the first version: a perfect UI/UX **intern** with a Bachelor's could only reach 98, because education favoured a Master's. That led to the current UI/UX split, where education is worth 5 points and any degree earns the same level points (section 5).

Three more false matches were fixed before the review:
- engineering "product design" counted as UI/UX
- vehicle "usability" counted as UX testing
- a finance "product portfolio" counted as a design portfolio

**Where we refused to guess:**
- AR-0207 and SS-4484 have jobs with no dates. Those jobs count as 0 years and stay flagged. SS-4484 lands at 49.2 for LCA, so it is labelled "Needs a look".
- `anonymized_resume_…327.docx` is truly empty: the page, comments and footnotes are all blank, with no images. It stays in the list with a "could not read" error rather than being silently dropped.

---

## 5. Scoring (step ③)

Each resume gets **two scores out of 100**, one per job. Each score is the sum of four parts, and each part lists its reasons and evidence.

### LCA Consultant (JD1)

| Part | Points | Rule |
|---|---|---|
| Skills match | 40 | **Must-haves, 60% (24 pts):** Life Cycle Assessment · GaBi or SimaPro · LCI data work. Each group gets full points if **used in work or a project**, or 60% if **only listed**. **Bonus skills, 40% (16 pts):** EPD, LCA method (functional unit, system boundary), openLCA, other LCA software, ecoinvent, carbon footprint, cradle-to-gate, LCIA, benchmarking, GHG, circular economy. Each gives 16/6 if used or 16/10 if listed, capped at 16. |
| Relevant experience | 25 | effective years = LCA years + ½ × other sustainability years. Full marks within **4–6 yrs**, linear below 4, 23 above 6. |
| LCA projects | 20 | 20 × min(count, 3) / 3. The JD asks for at least 3 projects. |
| Education | 15 | PhD/Master's 10, Bachelor's 8, Diploma 5, plus 5 for an environmental, energy or engineering field. Capped at 15. |

### UI/UX Design Intern (JD2)

**Why this split (40 / 40 / 15 / 5)?** The JDs give no weights, so each split follows what its JD stresses. The UI/UX JD is about tools (Figma, prototyping, user research) and about output: its 90-day goals are a website revamp and a job board. So skills and shown work get 40 each. The JD **never mentions a degree**, so education is worth only 5, and a degree also breaks ties between equal scores. The first version copied the LCA split (education 15, design work 30); this was changed after review because it didn't match the JD.

| Part | Points | Rule |
|---|---|---|
| Skills match | 40 | **Must-haves, 60%:** Figma · Prototyping · User research or user psychology · UI/UX design principles. Used = full, listed = 60%. **Bonus, 40%:** wireframing, user flows/IA, design systems, accessibility, visual craft, portfolio, responsive, Framer/ProtoPie. |
| Design projects & portfolio | 40 | 8 points per design project or design job (max 4 = 32), plus 8 if a portfolio is mentioned |
| Experience fit (0–1 yr) | 15 | ≤1.5 yrs of design work: 15. 0 yrs with a design background: 9. 1.5–3 yrs: 12. Over 3 yrs: 8 (over-qualified for an internship). No design background: 0. |
| Education | 5 | Any degree 2 (Bachelor's in progress included), Diploma 1, plus 3 for a design, HCI, mass/visual communication or psychology field |

**Ranking order:** score first. On an **equal score, the higher degree ranks first** (PhD > Master's > Bachelor's > Diploma). Then more relevant years, then ID, so the order is always the same. A degree never beats a higher score; it only decides between otherwise equal candidates. Uploads are placed with the same rule.

---

## 6. Classification (step ④)

| Label | Rule |
|---|---|
| Fits LCA / Fits UI/UX | A score of **50+** for that role only |
| Fits both | 50+ for both roles |
| Fits neither | Below 50 for both roles |
| Needs a look (Uncertain) | The file is unreadable; **or** a score is within ±5 of 50 and there's no clear winner; **or** the resume is very short and has some signal |

**Current result:** 11 LCA · 23 UI/UX · 0 Both · 8 Neither · 5 Uncertain.

**Top 3, LCA:**
1. HM-4257: 88.4 (40 EPDs)
2. TM-4495: 87.1
3. SRK-4455: 84.5

**Top 3, UI/UX:**
1. DVJ-0268: 90.9
2. CG-0278: 89
3. APS-0222: 82.6

---

## 7. Uploading a new resume

`POST /api/rank` (multipart field `file`, `.docx` or `.pdf`, up to 4 MB) runs **the same** extract, score and classify functions. It returns both scores, the label and the breakdown, plus its rank in the pile, so a result reads like "#4 of 48". The rank uses the same order as the lists: score, then higher degree, then relevant years.

Nothing is stored. If the upload matches a resume already in the pile, the app says so. Wrong file types, large files and unreadable files get plain-English messages.

---

## 8. Decisions and known limits

- **The JD and the brief conflict on experience.** The assignment says the LCA role needs 4–6 years; the JD page says 2–3. We follow the assignment's **4–6**. It's one setting (`config/jobs.ts`) and is noted on the "How scoring works" page.
- **ISO 14040/14044 is not scored.** Anonymisation removed the numbers ("ISO 14040" became "ISO /, ISO"), so nobody can show it. Scoring it would punish everyone equally while hiding the reason. Affected resumes get an info flag instead.
- **Portfolio links** were mostly removed by anonymisation, so the portfolio bonus is rarely given.
- **Why not ML or an LLM scorer?** There are 47 resumes and no hiring outcomes to learn from, and the brief requires explainable rankings. Fixed rules with evidence are transparent and repeatable, and easy for HR to challenge. AI was used as a coding assistant and to propose fixes during the review. A person verified every change against the original resume.
- **Pattern matching can miss unusual wording.** The human review, the evidence quotes and the Problems page are there to catch this. A next step could be an optional embedding similarity score (at most 10%, shown separately).
- **17 low-risk resumes were not hand-checked.** They have no warnings and aren't in the top 5. Each shows "not checked" in the app.

---

## 9. Run it locally

```bash
npm install
npm run pipeline   # extract → review export/apply → score  (writes data/*.json)
npm test           # 46 unit tests (dates, extraction, scoring, review, ideal-candidate check)
npm run dev        # http://localhost:3000
```

To change the requirements, edit `config/jobs.ts` (must-haves, bonus skills, target years) or `lib/skills.ts` (skills and synonyms), then run `npm run score`.

### Project layout

```
config/jobs.ts           JD1 + JD2 as settings
lib/skills.ts            skill dictionary + role signal words
lib/dates.ts             date-range parser, overlap merge
lib/extract.ts           resume → structured data + flags
lib/review.ts            merge human corrections, change log
lib/score.ts             transparent scoring with reasons/evidence
lib/classify.ts          labels + ranking
scripts/*.ts             pipeline steps (extract, review export/apply, score)
data/                    extracted.json, review.csv, review-log.json, verified.json, results.json
app/                     pages: rankings, candidate, problems, upload, how-it-works, /api/rank
tests/                   Vitest unit tests
```
