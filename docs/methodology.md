# Methodology & ranking logic (text for the submission form)

**Method:** A rule-based pipeline in Next.js and TypeScript. I didn't use an LLM scorer: there are only 47 resumes and no hiring outcomes to learn from, and every rank has to be explainable.

1. **Extract:** Each resume (.docx, or PDF on upload) is split into sections. Jobs and dates are parsed, about 15 date formats in all, with overlapping jobs counted once. Skills come from a 37-skill synonym dictionary, and each skill is marked "used in work" or "only listed", with quotes as evidence. Degrees and projects are extracted too. Missing or unclear data is flagged, never guessed.
2. **Verify:** I exported a review sheet sorted by risk and checked 30 of the 47 resumes against the originals. That covers every flagged resume and the top 5 of each list. 3 were corrected. The review found 9 extractor gaps, which I fixed in code with tests. Every change is logged as old → new.
3. **Score (0–100 per role):**
   - **LCA:** skills 40 (must-haves are LCA, GaBi/SimaPro and LCI data work), experience 25 (target 4–6 years; other sustainability years count half), LCA projects 20 (3 or more = full), education 15.
   - **UI/UX:** skills 40 (Figma, prototyping, user research, UX principles), design projects and portfolio 40, internship experience fit 15 (0–1 year is ideal), education 5 (the JD asks for no degree).
   - The JDs give no weights; each split follows what its JD stresses.
   - A skill used in work earns full points; one only listed earns 60%.
   - Checked by tests: an ideal resume written from each JD scores exactly 100, and an unrelated one scores under 15.
4. **Rank and classify:** Highest score first; on an equal score, the higher degree ranks first, then more relevant years. A score of 50 or more is a fit. "Needs a look" means the file is unreadable, a score is within 5 points of 50, or the data is thin.

Every score shows its reasons and quotes. Uploading a resume runs the same code and reports its rank in the pile.

**Notes:**
- Anonymisation removed the ISO numbers from the resumes, so ISO 14040/14044 isn't scored.
- The JD says 2–3 years but the brief says 4–6; I used 4–6.
