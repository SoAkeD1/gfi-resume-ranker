// Server-side access to the precomputed results (data/results.json).
import results from "@/data/results.json";
import type { Result, Row } from "./types";
import type { Role } from "./skills";
import { degreeRank } from "./classify";

export const RESULTS = results as unknown as Result[];

export const getResult = (id: string) => RESULTS.find((r) => r.id === id) ?? null;

export function toRow(r: Result): Row {
  const top = (role: Role) =>
    r.skills.filter((s) => s.role === role).sort((a, b) => Number(b.usedInWork) - Number(a.usedInWork))
      .slice(0, 3).map((s) => s.label.replace(/\s*\(.*\)$/, ""));
  return {
    id: r.id, headline: r.headline, label: r.classification.label, borderline: r.classification.borderline,
    score: { lca: r.scores.lca.total, uiux: r.scores.uiux.total },
    rank: r.rank,
    years: { lca: r.experience.relevantYears.lca ?? 0, uiux: r.experience.relevantYears.uiux ?? 0 },
    topSkills: { lca: top("lca"), uiux: top("uiux") },
    problems: r.flags.filter((f) => f.level !== "info").length,
    hasError: r.flags.some((f) => f.level === "error"),
    reviewed: r.review.status !== "not reviewed",
    missingMustHaves: { lca: r.scores.lca.missingMustHaves, uiux: r.scores.uiux.missingMustHaves },
  };
}

export const ROWS: Row[] = RESULTS.map(toRow);

/** Score + tie-breakers of every pile resume, used to place an uploaded resume. */
export const PILE_RANK_ITEMS: Record<Role, { score: number; degree: number; years: number }[]> = {
  lca: RESULTS.map((r) => ({ score: r.scores.lca.total, degree: degreeRank(r), years: r.experience.relevantYears.lca ?? 0 })),
  uiux: RESULTS.map((r) => ({ score: r.scores.uiux.total, degree: degreeRank(r), years: r.experience.relevantYears.uiux ?? 0 })),
};
