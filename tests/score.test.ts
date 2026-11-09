import { describe, it, expect } from "vitest";
import { extractFromText } from "../lib/extract";
import { scoreBoth } from "../lib/score";
import { classify, rankIds, degreeRank, rankInPile } from "../lib/classify";
import { applyReview } from "../lib/review";

const today = { y: 2026, m: 10 };

const LCA_CV = `ZZ

LCA Consultant

Experience

LCA Consultant — GreenCo   Jan 2021 – Present

• Performed Life Cycle Assessment of 5 products using SimaPro and ecoinvent, cradle-to-gate.
• Collected and validated LCI data; published 4 EPDs.

Education

M.Tech in Environmental Engineering

Some University, 2018 - 2020

Core Skills

Platforms: SimaPro, GaBi
`;

const UX_CV = `YY

UI/UX Designer

Experience

UI/UX Design Intern — Studio   Jan 2026 – Jun 2026

• Designed app screens in Figma, ran user research interviews and usability testing.

Projects / Deliverables

Food Delivery App Redesign

Wireframes, user flows and a high-fidelity Figma prototype.

Education

B.Des in Communication Design

NID, 2022 - 2026

Core Skills

Platforms: Figma
`;

describe("scoring", () => {
  const lca = extractFromText(LCA_CV, "anonymized_ZZ_1.docx", today);
  const ux = extractFromText(UX_CV, "anonymized_YY_2.docx", today);
  const sl = scoreBoth(lca), su = scoreBoth(ux);

  it("scores parts that add up to the total and stay within max", () => {
    for (const s of [sl.lca, sl.uiux, su.lca, su.uiux]) {
      const sum = s.parts.reduce((n, p) => n + p.points, 0);
      expect(Math.abs(sum - s.total)).toBeLessThan(0.11);
      for (const p of s.parts) expect(p.points).toBeLessThanOrEqual(p.max);
      expect(s.total).toBeLessThanOrEqual(100);
    }
  });
  it("an LCA expert scores high for LCA and low for UI/UX", () => {
    expect(sl.lca.total).toBeGreaterThan(80);
    expect(sl.uiux.total).toBeLessThan(25);
    expect(sl.lca.parts.find((p) => p.key === "projects")!.points).toBe(20); // 4 EPDs ≥ 3
  });
  it("a design intern scores high for UI/UX and low for LCA", () => {
    expect(su.uiux.total).toBeGreaterThan(60); // small fixture: only 2 pieces of work
    expect(su.lca.total).toBeLessThan(25);
  });
  it("every awarded part explains itself", () => {
    for (const p of sl.lca.parts) if (p.points > 0) expect(p.reasons.length).toBeGreaterThan(0);
  });
  it("classifies each correctly", () => {
    expect(classify(lca, sl).label).toBe("LCA");
    expect(classify(ux, su).label).toBe("UI/UX");
  });
  it("gives 0 and Uncertain to unreadable files", () => {
    const e = extractFromText("", "anonymized_resume_3.docx", today);
    const s = scoreBoth(e);
    expect(s.lca.total + s.uiux.total).toBe(0);
    expect(classify(e, s).label).toBe("Uncertain");
  });
  it("reviewer corrections change the score and are logged", () => {
    const v = applyReview(lca, { id: lca.id, corrected_lcaYears: "1", reviewer_notes: "only 1 yr is real LCA" });
    expect(v.review.status).toBe("corrected");
    expect(v.review.changes[0].field).toBe("experience.relevantYears.lca");
    expect(scoreBoth(v).lca.total).toBeLessThan(sl.lca.total);
  });
  it("ranks by score, ties by years (same degree)", () => {
    const r = rankIds([{ id: "a", score: 50, degree: 3, years: 1 }, { id: "b", score: 50, degree: 3, years: 3 }, { id: "c", score: 90, degree: 3, years: 0 }]);
    expect([r.get("c"), r.get("b"), r.get("a")]).toEqual([1, 2, 3]);
  });
  it("on equal score, the higher degree ranks first, even with fewer years", () => {
    const r = rankIds([{ id: "bach", score: 80, degree: 3, years: 1 }, { id: "mast", score: 80, degree: 4, years: 0.5 }]);
    expect(r.get("mast")).toBe(1);
    expect(r.get("bach")).toBe(2);
  });
  it("degree never beats a higher score", () => {
    const r = rankIds([{ id: "phd", score: 79.9, degree: 5, years: 3 }, { id: "bach", score: 80, degree: 3, years: 0 }]);
    expect(r.get("bach")).toBe(1);
  });
  it("same Bachelor and Master resumes: same score, Master ranks higher (also for uploads)", () => {
    const base = UX_CV.replace("B.Des in Communication Design", "DEGREE");
    const bach = extractFromText(base.replace("DEGREE", "B.Des in Communication Design"), "anonymized_BB_10.docx", today);
    const mast = extractFromText(base.replace("DEGREE", "M.Des in Communication Design"), "anonymized_MM_11.docx", today);
    const sb = scoreBoth(bach).uiux.total, sm = scoreBoth(mast).uiux.total;
    expect(sm).toBe(sb);
    expect(degreeRank(mast)).toBeGreaterThan(degreeRank(bach));
    const item = (x: typeof bach, s: number) => ({ id: x.id, score: s, degree: degreeRank(x), years: x.experience.relevantYears.uiux ?? 0 });
    const r = rankIds([item(bach, sb), item(mast, sm)]);
    expect(r.get(mast.id)).toBe(1);
    // An uploaded Master's resume lands above the identical Bachelor's one already in the pile.
    expect(rankInPile({ score: sm, degree: degreeRank(mast), years: 0.5 }, [{ score: sb, degree: degreeRank(bach), years: 0.5 }])).toBe(1);
    expect(rankInPile({ score: sb, degree: degreeRank(bach), years: 0.5 }, [{ score: sm, degree: degreeRank(mast), years: 0.5 }])).toBe(2);
  });
});
