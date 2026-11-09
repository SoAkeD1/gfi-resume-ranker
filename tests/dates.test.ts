import { describe, it, expect } from "vitest";
import { parseRange, mergedMonths } from "../lib/dates";

const today = { y: 2026, m: 10 }; // Nov 2026

describe("parseRange", () => {
  const cases: [string, number, boolean?][] = [
    ["Jan 2019 – Dec 2019", 12],
    ["March 2023 – Present", 45, true],
    ["Sept 2021 – Jun 2023", 22],
    ["Sep ’25 – Dec ’25", 4],
    ["Jan 26 - April 26", 4],
    ["09/2023 – 09/2024", 13],
    ["09/2024 – Current", 27, true],
    ["May – July 2025", 3],
    ["Jun – Jul 2024", 2],
    ["AUG 2025 - PRESENT", 16, true],
    ["2016 - 2019", 36],
    ["Feb 2020 - Feb 2020", 1],
  ];
  for (const [raw, months, ongoing] of cases) {
    it(raw, () => {
      const r = parseRange(raw, today);
      expect(r.months).toBe(months);
      expect(r.ongoing).toBe(!!ongoing);
    });
  }

  it("caps future end dates to today and flags it", () => {
    const r = parseRange("Jun 2025 - Dec 2026", today);
    expect(r.months).toBe(18);
    expect(r.flags.join()).toMatch(/future/);
  });
  it("does not count jobs that start in the future", () => {
    expect(parseRange("Dec 2026 - Present", today).months).toBe(0);
  });
  it("flags missing dates", () => {
    for (const s of ["null", "Not specified", "Dates not provided", ""]) {
      const r = parseRange(s, today);
      expect(r.months).toBe(0);
      expect(r.flags[0]).toMatch(/missing/);
    }
  });
  it("reads duration-only text", () => {
    const r = parseRange("8 Months", today);
    expect(r.months).toBe(8);
    expect(r.flags[0]).toMatch(/duration/);
  });
  it("flags 2-digit years without apostrophe", () => {
    expect(parseRange("Jan 26 - April 26", today).flags.join()).toMatch(/2 digits/);
  });
});

describe("mergedMonths", () => {
  it("counts overlapping jobs once", () => {
    const a = parseRange("Jan 2020 - Dec 2020", today);
    const b = parseRange("Jun 2020 - Jun 2021", today);
    expect(mergedMonths([a, b])).toBe(18);
  });
  it("adds gaps separately", () => {
    const a = parseRange("Jan 2020 - Mar 2020", today);
    const b = parseRange("Jan 2021 - Mar 2021", today);
    expect(mergedMonths([a, b])).toBe(6);
  });
});
