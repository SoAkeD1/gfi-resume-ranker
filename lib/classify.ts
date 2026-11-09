// Step 4: classify each resume from its two scores, then rank.

import type { RoleScore } from "./score";
import type { ExtractedResume } from "./extract";
import type { Role } from "./skills";

export type Label = "LCA" | "UI/UX" | "Both" | "Neither" | "Uncertain";

export const THRESHOLD = 50;   // score needed to count as a match
export const MARGIN = 5;       // within ±5 of the threshold = borderline

export interface Classification { label: Label; reason: string; borderline: boolean }

export function classify(r: ExtractedResume, s: Record<Role, RoleScore>): Classification {
  const L = s.lca.total, U = s.uiux.total;
  if (r.flags.some((f) => f.level === "error"))
    return { label: "Uncertain", reason: "The file could not be read, so it cannot be judged. Check the original.", borderline: false };

  const lcaOk = L >= THRESHOLD, uxOk = U >= THRESHOLD;
  const near = (x: number) => Math.abs(x - THRESHOLD) < MARGIN;
  const borderline = near(L) || near(U);

  let label: Label = lcaOk && uxOk ? "Both" : lcaOk ? "LCA" : uxOk ? "UI/UX" : "Neither";
  let reason =
    label === "Both" ? `Scores ${THRESHOLD}+ for both roles (LCA ${L}, UI/UX ${U}).` :
    label === "LCA" ? `LCA score ${L} is ${THRESHOLD}+; UI/UX score ${U} is below.` :
    label === "UI/UX" ? `UI/UX score ${U} is ${THRESHOLD}+; LCA score ${L} is below.` :
    `Both scores are below ${THRESHOLD} (LCA ${L}, UI/UX ${U}).`;

  // Borderline and no clear winner → don't pretend to know.
  const unclear = borderline && (label === "Neither" || label === "Both");
  const veryShort = r.flags.some((f) => /very short/i.test(f.message)) && Math.max(L, U) >= 30;
  const thinData = (r.flags.filter((f) => f.level === "warning").length >= 3 && borderline) || (veryShort && label === "Neither");
  if (unclear || thinData) {
    label = "Uncertain";
    reason = veryShort && !borderline
      ? `Resume is very short, so scores may be too low (LCA ${L}, UI/UX ${U}) — needs a human look.`
      : `Close to the ${THRESHOLD}-point line (LCA ${L}, UI/UX ${U})${thinData ? " and data problems" : ""} — needs a human look.`;
  } else if (borderline) reason += " (Close to the line — worth a second look.)";
  return { label, reason, borderline };
}

/** Highest degree as a number: PhD 5, Master's 4, Bachelor's 3, Diploma 2, school 1, none 0. */
export function degreeRank(r: Pick<ExtractedResume, "education">): number {
  const ORDER = { phd: 5, master: 4, bachelor: 3, diploma: 2, school: 1, other: 0 } as const;
  return r.education.reduce((best, e) => Math.max(best, ORDER[e.level]), 0);
}

export interface RankItem { id: string; score: number; degree: number; years: number }

/** a before b? Score first; on equal score the higher degree wins, then more relevant years, then id (stable). */
export function compareRank(a: RankItem, b: RankItem): number {
  return b.score - a.score || b.degree - a.degree || b.years - a.years || a.id.localeCompare(b.id);
}

export function rankIds(items: RankItem[]): Map<string, number> {
  const sorted = [...items].sort(compareRank);
  return new Map(sorted.map((x, i) => [x.id, i + 1]));
}

/** Where a new resume would land in an existing ranked pile (1 = top). Ties go to the higher degree, then years. */
export function rankInPile(item: Omit<RankItem, "id">, pile: Omit<RankItem, "id">[]): number {
  const me = { ...item, id: "￿" }; // sorts after any real id on a full tie
  return 1 + pile.filter((p) => compareRank({ ...p, id: "" }, me) < 0).length;
}
