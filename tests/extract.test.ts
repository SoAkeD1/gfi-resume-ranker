import { describe, it, expect } from "vitest";
import { extractFromText } from "../lib/extract";

const today = { y: 2026, m: 10 };

const SAMPLE = `ZZ

Sustainability Engineer

Experience

Engineer — Acme Motors   March 2023 – Present

• Performed Life Cycle Assessment using SimaPro for EV platforms.

Intern — GreenCo   Jan 2022 - Jun 2022

• Collected LCI data and validated data quality.

Projects / Deliverables

Battery Pack LCA

Cradle-to-gate LCA of a battery pack using SimaPro.

Education

M.Tech in Environmental Engineering

Some University, 2021 - 2023

Professional Summary

Engineer with 4 years of experience in LCA.

Core Skills

Platforms: SimaPro, Figma
`;

describe("extractFromText", () => {
  const r = extractFromText(SAMPLE, "anonymized_ZZ_1234567890.docx", today);

  it("builds a short id", () => expect(r.id).toBe("ZZ-7890"));
  it("reads header", () => {
    expect(r.initials).toBe("ZZ");
    expect(r.headline).toBe("Sustainability Engineer");
  });
  it("finds both jobs with dates", () => {
    expect(r.jobs).toHaveLength(2);
    expect(r.jobs[0].company).toBe("Acme Motors");
    expect(r.jobs[1].isInternship).toBe(true);
  });
  it("computes total and LCA-relevant years", () => {
    expect(r.experience.totalYears).toBe(4.3); // 45 + 6 months
    expect(r.experience.relevantYears.lca).toBe(4.3);
    expect(r.experience.relevantYears.uiux).toBe(0);
    expect(r.experience.claimedYears).toBe(4);
  });
  it("tells used skills from listed-only skills", () => {
    const sima = r.skills.find((s) => s.id === "simapro")!;
    const figma = r.skills.find((s) => s.id === "figma")!;
    expect(sima.usedInWork).toBe(true);
    expect(figma.usedInWork).toBe(false);
    expect(figma.listedAsSkill).toBe(true);
  });
  it("counts LCA projects with evidence", () => {
    expect(r.lcaProjectCount.count).toBe(3); // 1 project + 2 jobs
    expect(r.lcaProjectCount.evidence[0]).toMatch(/Battery Pack LCA/);
  });
  it("parses education", () => {
    expect(r.education[0].level).toBe("master");
    expect(r.education[0].field).toBe("Environmental Engineering");
    expect(r.education[0].endYear).toBe(2023);
  });
  it("does not read initials 'UI' as a UI skill (review bug)", () => {
    const e = extractFromText("UI\n\nConsultant\n\nCore Skills\n\nExcel, LCA reporting\n" + "x".repeat(900), "anonymized_UI_1.docx", today);
    expect(e.skills.some((s) => s.id === "ui_design")).toBe(false);
  });
  it("does not read 'MS Ramaiah University' as an MS degree (review bug)", () => {
    const e = extractFromText("ZZ\n\nEngineer\n\nEducation\n\nM.Tech in Automotive Engineering\n\nMS Ramaiah University of Applied Science\n\n" + "x".repeat(900), "anonymized_ZZ_2.docx", today);
    expect(e.education).toHaveLength(1);
    expect(e.education[0].institution).toBe("MS Ramaiah University of Applied Science");
  });
  it("keeps brackets in job titles (review bug)", () => {
    const e = extractFromText("ZZ\n\nX\n\nExperience\n\nProject Associate (UNDP - supported) — IIT Tirupati   Dec 2023 – Mar 2025\n\n" + "x".repeat(900), "anonymized_ZZ_3.docx", today);
    expect(e.jobs[0].title).toBe("Project Associate (UNDP - supported)");
    expect(e.jobs[0].company).toBe("IIT Tirupati");
  });
  it("counts outcome-described projects as design work only for designers (review bug)", () => {
    const proj = "\n\nProjects / Deliverables\n\nTruck Aggregator App\n\nCut waiting time for users to 1-2 days.\n\n";
    const designer = extractFromText("ZZ\n\nProduct Designer" + proj + "x".repeat(900), "anonymized_ZZ_4.docx", today);
    const engineer = extractFromText("ZZ\n\nMechanical Engineer" + proj + "x".repeat(900), "anonymized_ZZ_5.docx", today);
    expect(designer.projects[0].relevantTo).toContain("uiux");
    expect(engineer.projects[0].relevantTo).not.toContain("uiux");
  });
  it("reads Madhyamik / Higher Secondary as school, not a degree (review bug)", () => {
    const e = extractFromText("ZZ\n\nDesigner\n\nEducation\n\nBachelor of Arts\n\nUniversity of Calcutta, Completed in 2024\n\nHigher Secondary\n\nWBCHSE, Completed in 2019\n\nMadhymik\n\nWBBSC, Completed in 2017\n\n" + "x".repeat(900), "anonymized_ZZ_6.docx", today);
    expect(e.education.map((x) => x.level)).toEqual(["bachelor", "school", "school"]);
  });
  it("flags empty files instead of guessing", () => {
    const e = extractFromText("  ", "anonymized_resume_1.docx", today);
    expect(e.flags[0].level).toBe("error");
    expect(e.jobs).toHaveLength(0);
  });
});
