import type { VerifiedResume } from "./review";
import type { RoleScore } from "./score";
import type { Classification } from "./classify";
import type { Role } from "./skills";

/** One candidate as stored in data/results.json (and returned by /api/rank). */
export type Result = Omit<VerifiedResume, "rawText"> & {
  textPreview: string;
  scores: Record<Role, RoleScore>;
  classification: Classification;
  rank: Record<Role, number>;
};

/** Slim row sent to the ranked table (keeps the page light). */
export interface Row {
  id: string;
  headline: string | null;
  label: Classification["label"];
  borderline: boolean;
  score: Record<Role, number>;
  rank: Record<Role, number>;
  years: Record<Role, number>;
  topSkills: Record<Role, string[]>;
  problems: number;          // errors + warnings
  hasError: boolean;
  reviewed: boolean;
  missingMustHaves: Record<Role, string[]>;
}
