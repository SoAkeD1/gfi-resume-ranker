// Helper: record a reviewer decision in data/review.csv without opening Excel.
// Usage: npx tsx scripts/set-review.ts <id> col=value [col=value ...]
import fs from "node:fs";
import path from "node:path";
import { parseCsv, toCsv } from "../lib/csv";
import { EDIT_COLUMNS } from "../lib/review";

const file = path.join(process.cwd(), "data", "review.csv");
const [id, ...pairs] = process.argv.slice(2);
const rows = parseCsv(fs.readFileSync(file, "utf8"));
const row = rows.find((r) => r.id === id);
if (!row) { console.error(`No row with id ${id}`); process.exit(1); }
for (const p of pairs) {
  const i = p.indexOf("=");
  const col = p.slice(0, i), val = p.slice(i + 1);
  if (!EDIT_COLUMNS.includes(col)) { console.error(`Not an editable column: ${col}`); process.exit(1); }
  row[col] = val;
}
const headers = Object.keys(rows[0]);
fs.writeFileSync(file, "﻿" + toCsv(rows, headers));
console.log(`${id}: ${pairs.join("  ")}`);
