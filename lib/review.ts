// Merge human corrections (from data/review.csv) into extracted data.
// Every change is logged so the review is auditable.

import type { ExtractedResume, SkillHit } from "./extract";
import { SKILLS } from "./skills";

export const EDIT_COLUMNS = [
  "corrected_totalYears", "corrected_lcaYears", "corrected_uiuxYears", "corrected_lcaProjects",
  "add_skills", "remove_skills", "corrected_eduField", "review_status", "reviewer_notes",
];

export interface ReviewInfo {
  status: "not reviewed" | "checked - ok" | "corrected";
  notes: string | null;
  changes: { field: string; from: unknown; to: unknown }[];
}

export type VerifiedResume = ExtractedResume & { review: ReviewInfo };

const num = (s: string | undefined) => {
  if (s === undefined || s.trim() === "") return undefined;
  const n = Number(s);
  if (Number.isNaN(n) || n < 0 || n > 60) throw new Error(`not a valid number: "${s}"`);
  return n;
};
const list = (s: string | undefined) => (s ?? "").split(/[\s,;]+/).map((x) => x.trim()).filter(Boolean);

export function applyReview(r: ExtractedResume, row: Record<string, string> | undefined): VerifiedResume {
  const v: VerifiedResume = structuredClone({ ...r, review: { status: "not reviewed", notes: null, changes: [] } as ReviewInfo });
  if (!row) return v;
  const log = (field: string, from: unknown, to: unknown) => v.review.changes.push({ field, from, to });

  const setNum = (col: string, field: string, get: () => number | null, set: (n: number) => void) => {
    const n = num(row[col]);
    if (n !== undefined && n !== get()) { log(field, get(), n); set(n); }
  };
  setNum("corrected_totalYears", "experience.totalYears", () => v.experience.totalYears, (n) => (v.experience.totalYears = n));
  setNum("corrected_lcaYears", "experience.relevantYears.lca", () => v.experience.relevantYears.lca, (n) => (v.experience.relevantYears.lca = n));
  setNum("corrected_uiuxYears", "experience.relevantYears.uiux", () => v.experience.relevantYears.uiux, (n) => (v.experience.relevantYears.uiux = n));
  setNum("corrected_lcaProjects", "lcaProjectCount.count", () => v.lcaProjectCount.count, (n) => {
    v.lcaProjectCount.count = n;
    v.lcaProjectCount.evidence.unshift(`Reviewer set count to ${n}`);
  });

  for (const id of list(row.remove_skills)) {
    if (v.skills.some((s) => s.id === id)) { v.skills = v.skills.filter((s) => s.id !== id); log("skills", id, "(removed)"); }
  }
  for (const id of list(row.add_skills)) {
    const def = SKILLS.find((s) => s.id === id);
    if (!def) throw new Error(`unknown skill id "${id}" — see lib/skills.ts`);
    if (v.skills.some((s) => s.id === id)) continue;
    const hit: SkillHit = { id, label: def.label, role: def.role, usedInWork: true, listedAsSkill: false,
      evidence: [{ section: "other", text: "Added by human reviewer after reading the original resume." }] };
    v.skills.push(hit); log("skills", "(missing)", id);
  }
  if (row.corrected_eduField && v.education[0] && row.corrected_eduField !== v.education[0].field) {
    log("education[0].field", v.education[0].field, row.corrected_eduField);
    v.education[0].field = row.corrected_eduField;
  }

  v.review.notes = row.reviewer_notes || null;
  const st = (row.review_status ?? "").toLowerCase();
  v.review.status = v.review.changes.length ? "corrected" : st === "ok" || st === "checked" ? "checked - ok" : "not reviewed";
  return v;
}
