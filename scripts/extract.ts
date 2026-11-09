// Step 1: extract structured data from every resume in public/resumes → data/extracted.json
// Run: npm run extract
import fs from "node:fs";
import path from "node:path";
import { extractFromText, bufferToText, type ExtractedResume } from "../lib/extract";
import { REFERENCE_DATE } from "../config/jobs";

const dir = path.join(process.cwd(), "public", "resumes");
const outFile = path.join(process.cwd(), "data", "extracted.json");

(async () => {
  const files = fs.readdirSync(dir).filter((f) => /\.(docx|pdf)$/i.test(f)).sort();
  const results: ExtractedResume[] = [];
  for (const f of files) {
    let text = "";
    try {
      text = await bufferToText(fs.readFileSync(path.join(dir, f)), f);
    } catch (e) {
      // Unreadable file: keep a record with an error flag instead of skipping it.
      text = "";
      console.warn(`! ${f}: ${(e as Error).message}`);
    }
    results.push(extractFromText(text, f, REFERENCE_DATE));
  }

  // Duplicate detection (same text in two files)
  const seen = new Map<string, string>();
  for (const r of results) {
    const key = r.rawText.replace(/\s+/g, " ").trim().slice(0, 600);
    if (r.textLength > 50 && seen.has(key))
      r.flags.push({ level: "warning", message: `Looks like a duplicate of ${seen.get(key)}.` });
    else seen.set(key, r.id);
  }

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2));

  // Console summary
  const err = results.filter((r) => r.flags.some((f) => f.level === "error"));
  const warn = results.filter((r) => !err.includes(r) && r.flags.some((f) => f.level === "warning"));
  console.log(`\nExtracted ${results.length} resumes → data/extracted.json`);
  console.log(`  clean: ${results.length - err.length - warn.length}   warnings: ${warn.length}   errors: ${err.length}\n`);
  console.log("ID        | headline                       | jobs | totYr | LCAyr | UXyr | LCAproj | top skills");
  for (const r of results) {
    const top = r.skills.filter((s) => s.usedInWork).slice(0, 4).map((s) => s.id).join(",");
    console.log(
      `${r.id.padEnd(9)} | ${(r.headline ?? "-").slice(0, 30).padEnd(30)} | ${String(r.jobs.length).padStart(4)} | ` +
      `${String(r.experience.totalYears ?? "-").padStart(5)} | ${String(r.experience.relevantYears.lca ?? "-").padStart(5)} | ` +
      `${String(r.experience.relevantYears.uiux ?? "-").padStart(4)} | ${String(r.lcaProjectCount.count).padStart(7)} | ${top}`);
  }
})();
