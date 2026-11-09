// Sanity check of the scoring design: an ideal candidate written straight from each JD
// must score 100, and a clearly unrelated candidate must score low.
// (This check found that a perfect UI/UX intern with a Bachelor's could only reach 98.)
import { describe, it, expect } from "vitest";
import { extractFromText } from "../lib/extract";
import { scoreBoth } from "../lib/score";
import { classify } from "../lib/classify";

const today = { y: 2026, m: 10 };

const PERFECT_LCA = `PL

LCA Consultant

Experience

LCA Consultant — GreenCo   Jan 2021 – Dec 2025

• Performed cradle-to-gate Life Cycle Assessment (LCA) studies in SimaPro and GaBi with ecoinvent data.
• Collected and validated LCI data; defined functional unit and system boundary; ran impact assessment.
• Published 6 EPDs and carbon footprint reports; benchmarking against industry peers.

Projects / Deliverables

Battery Pack LCA

Cradle-to-gate LCA of an EV battery pack in SimaPro.

Steel Beam LCA

Life Cycle Assessment comparing recycled and virgin steel.

Packaging LCA

LCA and EPD for food packaging.

Education

M.Tech in Environmental Engineering

Some University, 2018 - 2020
`;

const PERFECT_UX = `PU

UI/UX Designer

Experience

UI/UX Design Intern — Studio   Jan 2026 – Jun 2026

• Ran user research and usability testing; built wireframes, user flows and a Figma prototype.
• Created an accessible design system (WCAG) with clear typography and responsive layouts in Framer.

Projects / Deliverables

Job Board Redesign

UX case study: user research, wireframes and a high-fidelity Figma prototype.

Food App UI

Mobile app UI design in Figma with user flows.

Event Booking UX

Interaction design and usability testing for an event booking app; portfolio website case study.

Education

B.Des in Interaction Design

NID, 2022 - 2026
`;

const UNRELATED = `UN

Accountant

Experience

Accountant — Ledger Co   Jan 2020 – Present

• Prepared monthly tax filings and payroll.

Education

B.Com in Accounting

Some College, 2016 - 2019
`;

describe("perfect candidate check", () => {
  it("an ideal LCA consultant scores 100 for LCA", () => {
    const r = extractFromText(PERFECT_LCA, "anonymized_PL_1.docx", today);
    const s = scoreBoth(r);
    expect(s.lca.parts.map((p) => [p.key, p.points])).toEqual([["skills", 40], ["experience", 25], ["projects", 20], ["education", 15]]);
    expect(s.lca.total).toBe(100);
    expect(classify(r, s).label).toBe("LCA");
  });

  it("an ideal UI/UX intern with a Bachelor's scores 100 for UI/UX", () => {
    const r = extractFromText(PERFECT_UX, "anonymized_PU_2.docx", today);
    const s = scoreBoth(r);
    expect(s.uiux.parts.map((p) => [p.key, p.points])).toEqual([["skills", 40], ["portfolio", 40], ["experience", 15], ["education", 5]]);
    expect(s.uiux.total).toBe(100);
    expect(classify(r, s).label).toBe("UI/UX");
  });

  it("an unrelated candidate scores low for both", () => {
    const r = extractFromText(UNRELATED, "anonymized_UN_3.docx", today);
    const s = scoreBoth(r);
    expect(s.lca.total).toBeLessThan(15);
    expect(s.uiux.total).toBeLessThan(15);
    expect(classify(r, s).label).toBe("Neither");
  });
});
