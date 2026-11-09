// Date-range parsing for job lines, e.g. "Jan 2019 – Present", "Sep ’25 – Dec ’25",
// "09/2023 – 09/2024", "May – July 2025", "2016 - 2019", "8 Months".
// Output is in whole months so overlapping jobs can be merged.

export interface YM { y: number; m: number } // m is 0-based

export interface ParsedRange {
  raw: string;
  start: YM | null;
  end: YM | null;
  months: number;      // inclusive length after capping; 0 if unknown
  ongoing: boolean;
  flags: string[];     // human-readable problems
}

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

const monthIndex = (word: string): number | null => {
  const k = word.toLowerCase().replace(/\./g, "").slice(0, 3);
  return k in MONTHS ? MONTHS[k] : null;
};

const PRESENT = /^(present|current|currently|ongoing|now|till date|to date|date)$/i;
const UNKNOWN = /^(null|not specified|dates not provided|n\/?a|-)?$/i;

type Point = { ym: YM; precision: "month" | "year"; twoDigit?: boolean } | "present" | { monthOnly: number } | null;

function parsePoint(s: string): Point {
  const t = s.trim().replace(/[.,]$/, "");
  if (PRESENT.test(t)) return "present";
  let m: RegExpMatchArray | null;
  // Month + 4-digit year: "Jan 2019", "September 2025", "Sept 2021"
  if ((m = t.match(/^([A-Za-z]{3,9})\.?\s+(\d{4})$/))) {
    const mi = monthIndex(m[1]);
    if (mi !== null) return { ym: { y: +m[2], m: mi }, precision: "month" };
  }
  // Month + 2-digit year: "Sep ’25", "Jan 26", "Mar '25"
  if ((m = t.match(/^([A-Za-z]{3,9})\.?\s*['’`]?\s*(\d{2})$/))) {
    const mi = monthIndex(m[1]);
    if (mi !== null) return { ym: { y: 2000 + +m[2], m: mi }, precision: "month", twoDigit: !/['’`]/.test(t) };
  }
  // MM/YYYY or MM-YYYY
  if ((m = t.match(/^(\d{1,2})[/.](\d{4})$/))) {
    const mo = +m[1] - 1;
    if (mo >= 0 && mo < 12) return { ym: { y: +m[2], m: mo }, precision: "month" };
  }
  // YYYY-MM (ISO-ish)
  if ((m = t.match(/^(\d{4})-(\d{2})$/))) return { ym: { y: +m[1], m: +m[2] - 1 }, precision: "month" };
  // Year only
  if ((m = t.match(/^(\d{4})$/))) return { ym: { y: +m[1], m: 0 }, precision: "year" };
  // Month only (year comes from the other side): "May – July 2025"
  const mi = monthIndex(t);
  if (mi !== null && /^[A-Za-z]{3,9}$/.test(t)) return { monthOnly: mi };
  return null;
}

export const toIndex = (d: YM) => d.y * 12 + d.m;
export const fromIndex = (i: number): YM => ({ y: Math.floor(i / 12), m: i % 12 });

export function parseRange(raw: string, today: YM): ParsedRange {
  const text = raw.trim();
  const res: ParsedRange = { raw: text, start: null, end: null, months: 0, ongoing: false, flags: [] };

  if (UNKNOWN.test(text)) { res.flags.push(`dates missing ("${text || "blank"}")`); return res; }

  // Duration only: "8 Months", "2 years"
  const m = text.match(/^(\d+(?:\.\d+)?)\s*(months?|mos?|years?|yrs?)$/i);
  if (m) {
    const n = parseFloat(m[1]);
    res.months = Math.round(/^y/i.test(m[2]) ? n * 12 : n);
    res.flags.push(`only a duration given ("${text}"), no dates`);
    return res;
  }

  // Normalise dashes and split into two sides
  const parts = text.replace(/[–—−]/g, "-").split(/\s*-\s*|\s+to\s+/i).filter(Boolean);
  if (parts.length !== 2) {
    const single = parsePoint(text);
    if (single && single !== "present" && "ym" in single) {
      res.start = res.end = single.ym;
      res.months = 1;
      res.flags.push(`single date only ("${text}")`);
    } else res.flags.push(`could not read dates ("${text}")`);
    return res;
  }

  let a = parsePoint(parts[0]);
  const b = parsePoint(parts[1]);
  if (a && typeof a === "object" && "monthOnly" in a && b && typeof b === "object" && "ym" in b) {
    a = { ym: { y: b.ym.y, m: a.monthOnly }, precision: "month" };
  }
  if (!a || typeof a !== "object" || !("ym" in a)) { res.flags.push(`could not read start date ("${text}")`); return res; }
  if (!b || (typeof b === "object" && !("ym" in b))) { res.flags.push(`could not read end date ("${text}")`); return res; }

  if (a.twoDigit || (b !== "present" && b.twoDigit)) res.flags.push(`year written with 2 digits ("${text}") — assumed 20xx`);
  if (a.precision === "year") res.flags.push(`year-only dates ("${text}") — month assumed`);

  res.start = a.ym;
  if (b === "present") { res.end = today; res.ongoing = true; }
  else res.end = b.precision === "year" ? { y: b.ym.y, m: 0 } : b.ym;

  const s = toIndex(res.start);
  let e = toIndex(res.end);
  const t = toIndex(today);
  if (s > t) { res.flags.push(`starts in the future ("${text}") — not counted`); res.months = 0; return res; }
  if (e > t) { res.flags.push(`end date is in the future ("${text}") — counted up to today`); e = t; res.end = today; }
  if (e < s) { res.flags.push(`end date before start date ("${text}")`); return res; }
  res.months = a.precision === "year" ? Math.max(e - s, 12) : e - s + 1;
  return res;
}

/** Total months covered by a set of ranges, counting overlaps once. */
export function mergedMonths(ranges: ParsedRange[]): number {
  const iv = ranges
    .filter((r) => r.start && r.end && r.months > 0)
    .map((r) => [toIndex(r.start!), toIndex(r.start!) + r.months - 1] as [number, number])
    .sort((x, y) => x[0] - y[0]);
  let total = 0, cur: [number, number] | null = null;
  for (const [s, e] of iv) {
    if (!cur || s > cur[1] + 1) { if (cur) total += cur[1] - cur[0] + 1; cur = [s, e]; }
    else cur[1] = Math.max(cur[1], e);
  }
  if (cur) total += cur[1] - cur[0] + 1;
  // Duration-only entries can't be placed on a timeline; add them as-is.
  total += ranges.filter((r) => !r.start && r.months > 0).reduce((n, r) => n + r.months, 0);
  return total;
}

export const monthsToYears = (m: number) => Math.round((m / 12) * 10) / 10;
