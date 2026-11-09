// Step 3: transparent, rule-based scoring. Each role is scored 0-100 from four parts.
// Every point awarded carries a plain-English reason and (where possible) a quote from the resume.
// Same functions are used for the 47-resume pile and for uploaded resumes.

import type { ExtractedResume, SkillHit } from "./extract";
import { JOBS } from "../config/jobs";
import type { Role } from "./skills";

export interface ScorePart {
  key: string;
  label: string;
  points: number;
  max: number;
  reasons: string[];   // plain English, shown to HR
  evidence: string[];  // quotes from the resume
}

export interface RoleScore {
  role: Role;
  total: number;       // 0-100, 1 decimal
  parts: ScorePart[];
  missingMustHaves: string[];
}

const r1 = (n: number) => Math.round(n * 10) / 10;
const quote = (h: SkillHit) => (h.evidence[0] ? `“${h.evidence[0].text}”` : "");

/** Must-have groups that every resume would fail because the data was anonymised away. */
const UNVERIFIABLE_GROUPS = new Set(["ISO 14040/14044"]);

// ─────────────── shared: skills part ───────────────
function skillsPart(r: ExtractedResume, role: Role, max: number, mustShare: number): ScorePart {
  const job = JOBS[role];
  const part: ScorePart = { key: "skills", label: "Skills match", points: 0, max, reasons: [], evidence: [] };
  const has = (id: string) => r.skills.find((s) => s.id === id);
  const groups = job.mustHaveGroups.filter((g) => !UNVERIFIABLE_GROUPS.has(g.label));
  const perGroup = (max * mustShare) / groups.length;
  const missing: string[] = [];

  for (const g of groups) {
    const hits = g.anyOf.map(has).filter(Boolean) as SkillHit[];
    const best = hits.find((h) => h.usedInWork) ?? hits[0];
    if (!best) { missing.push(g.label); continue; }
    const pts = best.usedInWork ? perGroup : perGroup * 0.6;
    part.points += pts;
    part.reasons.push(`Must-have “${g.label}”: ${best.usedInWork ? "used in real work/projects" : "listed as a skill only"} (+${r1(pts)})`);
    part.evidence.push(quote(best));
  }
  if (missing.length) part.reasons.push(`Missing must-haves: ${missing.join(", ")}`);

  const niceMax = max * (1 - mustShare);
  let nice = 0;
  const niceNames: string[] = [];
  for (const id of job.niceToHave) {
    const h = has(id);
    if (!h) continue;
    nice += h.usedInWork ? niceMax / 6 : niceMax / 10;
    niceNames.push(h.label);
  }
  nice = Math.min(nice, niceMax);
  if (niceNames.length) part.reasons.push(`Bonus skills: ${niceNames.join(", ")} (+${r1(nice)})`);
  part.points = r1(part.points + nice);
  (part as ScorePart & { missing?: string[] }).missing = missing;
  return part;
}

// ─────────────── LCA (JD1) ───────────────
export function scoreLca(r: ExtractedResume): RoleScore {
  const job = JOBS.lca;
  const skills = skillsPart(r, "lca", 40, 0.6);

  // Experience: core LCA years count fully; other sustainability years (ESG/GHG) count half.
  const lcaY = r.experience.relevantYears.lca ?? 0;
  const susY = Math.max(r.experience.sustainabilityYears ?? 0, lcaY);
  const eff = lcaY + 0.5 * (susY - lcaY);
  const { min, max } = job.experience;
  const exp: ScorePart = { key: "experience", label: "Relevant experience", points: 0, max: 25, reasons: [], evidence: [] };
  exp.points = eff >= min ? (eff <= max ? 25 : 23) : 25 * (eff / min);
  exp.reasons.push(`${lcaY} yrs in LCA work + ${r1(susY - lcaY)} yrs in other sustainability work (counted half) = ${r1(eff)} effective yrs; target ${min}-${max} yrs`);
  if (eff > max) exp.reasons.push("Above the target range (slightly lower score, may be over-qualified)");
  if (r.experience.totalYears === null) exp.reasons.push("Years could not be calculated from the resume");
  for (const j of r.jobs.filter((j) => j.relevantTo.includes("lca")))
    exp.evidence.push(`${j.title}${j.company ? " — " + j.company : ""} (${j.dates.raw})`);
  exp.points = r1(exp.points);

  // LCA projects: JD asks for at least 3.
  const n = r.lcaProjectCount.count;
  const proj: ScorePart = { key: "projects", label: "LCA projects", points: r1(20 * Math.min(n, 3) / 3), max: 20,
    reasons: [`${n} LCA project(s)/assignments found; JD asks for at least 3`], evidence: r.lcaProjectCount.evidence.slice(0, 4) };

  const edu = educationPart(r, "lca", "environmental / engineering");
  return finish("lca", [skills, exp, proj, edu]);
}

// ─────────────── UI/UX (JD2) ───────────────
export function scoreUiux(r: ExtractedResume): RoleScore {
  const skills = skillsPart(r, "uiux", 40, 0.6);

  // Portfolio & projects: design projects and design jobs both show practical work.
  const projects = r.projects.filter((p) => p.relevantTo.includes("uiux"));
  const designJobs = r.jobs.filter((j) => j.relevantTo.includes("uiux"));
  const pieces = projects.length + designJobs.length;
  const W = JOBS.uiux.designWork!;
  const port: ScorePart = { key: "portfolio", label: "Design projects & portfolio", points: Math.min(pieces, W.maxPieces) * W.perPiece,
    max: W.perPiece * W.maxPieces + W.portfolioBonus, reasons: [], evidence: [] };
  port.reasons.push(`${projects.length} design project(s) + ${designJobs.length} design job(s)/internship(s) = ${pieces} pieces of practical work (${W.perPiece} pts each, max ${W.maxPieces})`);
  port.evidence.push(...projects.slice(0, 3).map((p) => `Project: ${p.title}`), ...designJobs.slice(0, 2).map((j) => `Work: ${j.title}`));
  const pf = r.skills.find((s) => s.id === "portfolio") || (r.links.length ? { evidence: [{ text: r.links[0] }] } : null);
  if (pf) { port.points += W.portfolioBonus; port.reasons.push(`Portfolio / design links mentioned (+${W.portfolioBonus})`); port.evidence.push(pf.evidence[0]?.text ?? ""); }
  else port.reasons.push("No portfolio link found (links may have been removed by anonymisation)");

  // Experience fit for an internship (0-1 year): practice helps, seniority does not.
  const y = r.experience.relevantYears.uiux ?? 0;
  const exp: ScorePart = { key: "experience", label: "Experience fit (0-1 yr)", points: 0, max: 15, reasons: [], evidence: [] };
  const designBackground = r.skills.some((s) => s.role === "uiux" && s.usedInWork) || projects.length > 0
    || /design|ui|ux/i.test(r.headline ?? "");
  if (y === 0 && !designBackground) { exp.points = 0; exp.reasons.push("No design experience or design background found"); }
  else if (y === 0) { exp.points = 9; exp.reasons.push("No design work experience yet — fine for an internship, but no practice shown"); }
  else if (y <= 1.5) { exp.points = 15; exp.reasons.push(`${y} yrs design experience — ideal for a 0-1 yr internship`); }
  else if (y <= 3) { exp.points = 12; exp.reasons.push(`${y} yrs design experience — more than the internship needs`); }
  else { exp.points = 8; exp.reasons.push(`${y} yrs design experience — likely over-qualified for an internship`); }
  exp.evidence = designJobs.map((j) => `${j.title} (${j.dates.raw})`);

  const edu = educationPart(r, "uiux", "design / HCI / communication");
  return finish("uiux", [skills, port, exp, edu]);
}

// ─────────────── shared: education part ───────────────
function educationPart(r: ExtractedResume, role: Role, fieldLabel: string): ScorePart {
  const fields = JOBS[role].preferredEducationFields;
  const cfg = JOBS[role].education; // per role: see config/jobs.ts
  const part: ScorePart = { key: "education", label: "Education", points: 0, max: cfg.max, reasons: [], evidence: [] };
  const LEVEL_PTS = cfg.levelPoints;
  const higher = r.education.filter((e) => e.level !== "school");
  if (!higher.length) { part.reasons.push("No degree found"); return part; }
  const top = higher[0];
  part.points = LEVEL_PTS[top.level];
  part.reasons.push(`Highest: ${top.degree}${top.ongoing ? " (in progress)" : ""} (+${part.points})`);
  part.evidence.push(top.degree + (top.institution ? `, ${top.institution}` : ""));
  const match = higher.find((e) => fields.test(`${e.degree} ${e.field ?? ""}`));
  if (match) { part.points += cfg.fieldBonus; part.reasons.push(`Relevant field (${fieldLabel}): ${match.field ?? match.degree} (+${cfg.fieldBonus})`); }
  part.points = Math.min(cfg.max, part.points);
  return part;
}

function finish(role: Role, parts: ScorePart[]): RoleScore {
  const missing = (parts[0] as ScorePart & { missing?: string[] }).missing ?? [];
  delete (parts[0] as ScorePart & { missing?: string[] }).missing;
  return { role, total: r1(parts.reduce((n, p) => n + p.points, 0)), parts, missingMustHaves: missing };
}

export function scoreBoth(r: ExtractedResume): Record<Role, RoleScore> {
  // Unreadable file: score 0 rather than invent points from defaults.
  if (r.flags.some((f) => f.level === "error")) {
    const zero = (role: Role): RoleScore => ({ role, total: 0, missingMustHaves: [],
      parts: [{ key: "unreadable", label: "Not scored", points: 0, max: 100, reasons: ["File could not be read — not scored. Open the original resume."], evidence: [] }] });
    return { lca: zero("lca"), uiux: zero("uiux") };
  }
  return { lca: scoreLca(r), uiux: scoreUiux(r) };
}
