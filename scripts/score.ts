// Steps 3+4: score, classify and rank every verified resume → data/results.json
// Run: npm run score
import fs from "node:fs";
import path from "node:path";
import { scoreBoth } from "../lib/score";
import { classify, rankIds, degreeRank } from "../lib/classify";
import type { VerifiedResume } from "../lib/review";

const root = process.cwd();
const verified: VerifiedResume[] = JSON.parse(fs.readFileSync(path.join(root, "data", "verified.json"), "utf8"));

const scored = verified.map((r) => {
  const scores = scoreBoth(r);
  return { resume: r, scores, classification: classify(r, scores) };
});

const rankFor = (role: "lca" | "uiux") => rankIds(scored.map((s) => ({
  id: s.resume.id, score: s.scores[role].total, degree: degreeRank(s.resume), years: s.resume.experience.relevantYears[role] ?? 0,
})));
const lcaRank = rankFor("lca");
const uxRank = rankFor("uiux");

const results = scored.map(({ resume, scores, classification }) => {
  const { rawText, ...rest } = resume; // raw text stays out of the UI bundle
  return { ...rest, textPreview: rawText.slice(0, 400), scores, classification,
    rank: { lca: lcaRank.get(resume.id)!, uiux: uxRank.get(resume.id)! } };
});

fs.writeFileSync(path.join(root, "data", "results.json"), JSON.stringify(results, null, 2));

const count: Record<string, number> = {};
for (const r of results) count[r.classification.label] = (count[r.classification.label] ?? 0) + 1;
console.log("Labels:", count);
for (const role of ["lca", "uiux"] as const) {
  console.log(`\nTop 10 — ${role.toUpperCase()}`);
  results.filter((r) => r.rank[role] <= 10).sort((a, b) => a.rank[role] - b.rank[role]).forEach((r) =>
    console.log(`#${String(r.rank[role]).padEnd(3)}${r.id.padEnd(10)}${String(r.scores[role].total).padStart(5)}  ` +
      r.scores[role].parts.map((p) => `${p.key}:${p.points}/${p.max}`).join("  ") + `  [${r.classification.label}] ${(r.headline ?? "").slice(0, 30)}`));
}
console.log("\nAll (id  LCA  UIUX  label):");
results.forEach((r) => console.log(`${r.id.padEnd(12)}${String(r.scores.lca.total).padStart(5)}${String(r.scores.uiux.total).padStart(6)}  ${r.classification.label.padEnd(9)} ${(r.headline ?? "").slice(0, 35)}`));
