// Step 2a: export data/review.csv — one row per resume for a human to check in Excel / Google Sheets.
// Re-running keeps any corrections already typed into review.csv (matched by id).
// Run: npm run review:export
import fs from "node:fs";
import path from "node:path";
import { toCsv, parseCsv } from "../lib/csv";
import type { ExtractedResume } from "../lib/extract";
import { EDIT_COLUMNS } from "../lib/review";

const root = process.cwd();
const data: ExtractedResume[] = JSON.parse(fs.readFileSync(path.join(root, "data", "extracted.json"), "utf8"));
const csvPath = path.join(root, "data", "review.csv");

const HEADERS = [
  "priority", "check_reason", "id", "sourceFile", "headline", "flags",
  "totalYears", "lcaYears", "uiuxYears", "claimedYears", "lcaProjects",
  "topDegree", "eduField", "lcaSkills", "uiuxSkills", "jobs",
  ...EDIT_COLUMNS,
];

// Keep existing human edits
const previous = new Map<string, Record<string, string>>();
if (fs.existsSync(csvPath)) for (const r of parseCsv(fs.readFileSync(csvPath, "utf8"))) previous.set(r.id, r);

function priority(r: ExtractedResume): [number, string] {
  const reasons: string[] = [];
  let p = 3;
  if (r.flags.some((f) => f.level === "error")) { p = 1; reasons.push("file unreadable"); }
  if (r.flags.some((f) => f.level === "warning")) { p = Math.min(p, 1); reasons.push("has warnings"); }
  const lca = r.experience.relevantYears.lca ?? 0;
  const sus = r.experience.sustainabilityYears ?? 0;
  if (r.skills.some((s) => s.id === "lca") && (lca === 0 || sus - lca >= 1.5)) {
    p = Math.min(p, 2); reasons.push("LCA mentioned but LCA-years look low — check which jobs count");
  }
  if (r.experience.claimedYears !== null && Math.abs((r.experience.totalYears ?? 0) - r.experience.claimedYears) >= 1)
    { p = Math.min(p, 2); reasons.push("stated years ≠ calculated years"); }
  if (r.headline && /ui|ux|product design/i.test(r.headline) && r.projects.length === 0)
    { p = Math.min(p, 2); reasons.push("designer with no projects found"); }
  return [p, reasons.join("; ") || "spot check"];
}

const rows = data.map((r) => {
  const [p, why] = priority(r);
  const prev = previous.get(r.id) ?? {};
  const top = r.education[0];
  const row: Record<string, unknown> = {
    priority: p, check_reason: why, id: r.id, sourceFile: r.sourceFile, headline: r.headline ?? "",
    flags: r.flags.map((f) => `[${f.level}] ${f.message}`).join(" | "),
    totalYears: r.experience.totalYears ?? "", lcaYears: r.experience.relevantYears.lca ?? "",
    uiuxYears: r.experience.relevantYears.uiux ?? "", claimedYears: r.experience.claimedYears ?? "",
    lcaProjects: r.lcaProjectCount.count,
    topDegree: top?.degree ?? "", eduField: top?.field ?? "",
    lcaSkills: r.skills.filter((s) => s.role === "lca").map((s) => s.id + (s.usedInWork ? "" : "(listed)")).join(" "),
    uiuxSkills: r.skills.filter((s) => s.role === "uiux").map((s) => s.id + (s.usedInWork ? "" : "(listed)")).join(" "),
    jobs: r.jobs.map((j) => `${j.title} [${j.dates.raw}${j.relevantTo.length ? " → " + j.relevantTo.join("+") : ""}]`).join(" | "),
  };
  for (const c of EDIT_COLUMNS) row[c] = prev[c] ?? "";
  return row;
}).sort((a, b) => (a.priority as number) - (b.priority as number) || String(a.id).localeCompare(String(b.id)));

fs.writeFileSync(csvPath, "﻿" + toCsv(rows, HEADERS)); // BOM so Excel shows symbols correctly
const counts = [1, 2, 3].map((p) => rows.filter((r) => r.priority === p).length);
console.log(`Wrote data/review.csv (${rows.length} rows). Priority 1: ${counts[0]}, 2: ${counts[1]}, 3: ${counts[2]}`);
console.log("Kept edits for", Array.from(previous.values()).filter((r) => EDIT_COLUMNS.some((c) => r[c])).length, "rows.");
