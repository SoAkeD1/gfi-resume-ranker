// The two job descriptions, as structured config.
// Edit here to change what the ranker looks for — no code changes needed.

import type { Role } from "../lib/skills";

export interface JobConfig {
  role: Role;
  title: string;
  sourceUrl: string;
  summary: string;
  /** Skill ids (see lib/skills.ts). mustHave groups: any one skill in a group satisfies it. */
  mustHaveGroups: { label: string; anyOf: string[] }[];
  niceToHave: string[];
  /** Target years of relevant experience. */
  experience: { min: number; max: number; note?: string };
  preferredEducationFields: RegExp;
  /** Education part: points for the highest degree level, + fieldBonus for a preferred field, capped at max. */
  education: {
    max: number;
    fieldBonus: number;
    levelPoints: Record<"phd" | "master" | "bachelor" | "diploma" | "school" | "other", number>;
  };
  /** UI/UX only: practical design work (projects + design jobs) and portfolio. */
  designWork?: { perPiece: number; maxPieces: number; portfolioBonus: number };
}

// Point split per role (each adds to 100). The JDs give no weights; these follow what each JD stresses:
//   LCA   : skills 40 · experience 25 · LCA projects 20 · education 15   (JD lists tools, years, "3+ projects", a degree line)
//   UI/UX : skills 40 · design work 40 · experience fit 15 · education 5 (JD is about tools + output; it never mentions a degree)

export const JOBS: Record<Role, JobConfig> = {
  lca: {
    role: "lca",
    title: "LCA Consultant",
    sourceUrl: "https://tally.so/r/9q5plp",
    summary:
      "Run Life Cycle Assessment studies independently: collect/validate LCI data, model in GaBi or SimaPro, follow ISO 14040/14044, benchmark against public data.",
    mustHaveGroups: [
      { label: "Life Cycle Assessment", anyOf: ["lca"] },
      { label: "GaBi or SimaPro", anyOf: ["simapro", "gabi"] },
      { label: "LCI data work", anyOf: ["lci", "data_quality"] },
      { label: "ISO 14040/14044", anyOf: ["iso14040"] },
    ],
    niceToHave: ["epd", "lca_method", "openlca", "other_lca_tool", "ecoinvent", "carbon_footprint", "cradle", "lcia", "benchmarking", "ghg", "circular"],
    experience: {
      min: 4,
      max: 6,
      note: "Assignment brief says 4-6 years; the JD page itself says 2-3 years. We follow the brief (configurable).",
    },
    preferredEducationFields: /environment|sustainab|climate|ecolog|energy|chemical|civil|agricultur|mechanical|material/i,
    // JD: "Bachelor's or Master's (Environmental highly desired)" for a 4-6 yr consultant, so a Master's is a small plus.
    education: { max: 15, fieldBonus: 5, levelPoints: { phd: 10, master: 10, bachelor: 8, diploma: 5, school: 0, other: 0 } },
  },
  uiux: {
    role: "uiux",
    title: "UI/UX Design Intern",
    sourceUrl: "https://tally.so/r/0QovpQ",
    summary:
      "First designer at Growth For Impact: design website and job board in Figma, run user research, build high-fidelity prototypes. 0-1 year experience.",
    mustHaveGroups: [
      { label: "Figma", anyOf: ["figma"] },
      { label: "Prototyping", anyOf: ["prototyping"] },
      { label: "User research / psychology", anyOf: ["user_research", "user_psychology", "usability"] },
      { label: "UI/UX design principles", anyOf: ["ux_design", "ui_design", "hcd"] },
    ],
    niceToHave: ["wireframing", "user_flows", "design_systems", "accessibility", "visual_craft", "portfolio", "responsive", "proto_tools"],
    experience: { min: 0, max: 1 },
    // Not bare "communication": "Electronics Communication Engineering" is not a design field (found while writing the guide).
    preferredEducationFields: /design|hci|human[\s-]computer|interaction|visual|fine arts|animation|architecture|media|(?:mass|visual|design) communication|journalism|psycholog/i,
    // The UI/UX JD never mentions a degree, so education is worth only 5: any degree 2, design-related field +3.
    // A Bachelor's (finished or in progress) gets the same level points as a Master's; the degree only breaks ties.
    education: { max: 5, fieldBonus: 3, levelPoints: { phd: 2, master: 2, bachelor: 2, diploma: 1, school: 0, other: 0 } },
    // JD's 90-day goals are all output (revamp the website, build the job board), so shown work is worth as much as skills.
    designWork: { perPiece: 8, maxPieces: 4, portfolioBonus: 8 },
  },
};

/** Date treated as "today" for "Present" end dates — fixed so results are reproducible. */
export const REFERENCE_DATE = { y: 2026, m: 10 /* 0-based: November */ };
