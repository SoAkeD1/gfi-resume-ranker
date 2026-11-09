// Step 2b: merge human corrections from data/review.csv → data/verified.json + data/review-log.json
// Run: npm run review:apply
import fs from "node:fs";
import path from "node:path";
import { parseCsv } from "../lib/csv";
import { applyReview, type VerifiedResume } from "../lib/review";
import type { ExtractedResume } from "../lib/extract";

const root = process.cwd();
const data: ExtractedResume[] = JSON.parse(fs.readFileSync(path.join(root, "data", "extracted.json"), "utf8"));
const csvPath = path.join(root, "data", "review.csv");
const rows = fs.existsSync(csvPath) ? parseCsv(fs.readFileSync(csvPath, "utf8")) : [];
const byId = new Map(rows.map((r) => [r.id, r]));

const errors: string[] = [];
const verified: VerifiedResume[] = data.map((r) => {
  try { return applyReview(r, byId.get(r.id)); }
  catch (e) { errors.push(`${r.id}: ${(e as Error).message}`); return applyReview(r, undefined); }
});
if (errors.length) { console.error("Fix these cells in review.csv:\n  " + errors.join("\n  ")); process.exit(1); }

fs.writeFileSync(path.join(root, "data", "verified.json"), JSON.stringify(verified, null, 2));
const log = verified.filter((v) => v.review.status !== "not reviewed")
  .map((v) => ({ id: v.id, status: v.review.status, notes: v.review.notes, changes: v.review.changes }));
fs.writeFileSync(path.join(root, "data", "review-log.json"), JSON.stringify(log, null, 2));

const c = (s: string) => verified.filter((v) => v.review.status === s).length;
console.log(`verified.json written. corrected: ${c("corrected")}, checked-ok: ${c("checked - ok")}, not reviewed: ${c("not reviewed")}`);
