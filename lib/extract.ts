// Rule-based resume extractor. Pure functions: text in → structured data out.
// Used both by scripts/extract.ts (the 47-resume pile) and the upload API route.
// Principle: never guess. Missing/unclear values become null + a flag.

import { SKILLS, ROLE_JOB_SIGNALS, SUSTAINABILITY_SIGNALS, type Role } from "./skills";
import { parseRange, mergedMonths, monthsToYears, type ParsedRange, type YM } from "./dates";

export type SectionKey =
  | "header" | "experience" | "projects" | "education" | "certifications"
  | "summary" | "skills" | "tools" | "languages" | "awards" | "other";

export interface Evidence { section: SectionKey; text: string }

export interface SkillHit {
  id: string;
  label: string;
  role: Role;
  /** Seen in the Skills/Tools list only, or actually used in experience/projects. */
  usedInWork: boolean;
  listedAsSkill: boolean;
  evidence: Evidence[]; // up to 3 quotes
}

export interface Job {
  title: string;
  company: string | null;
  dates: ParsedRange;
  isInternship: boolean;
  bullets: string[];
  relevantTo: Role[];   // roles whose signal words appear in this job
  sustainabilityRelated: boolean;
}

export interface Project {
  title: string;
  description: string;
  relevantTo: Role[];
}

export interface Education {
  degree: string;
  level: "phd" | "master" | "bachelor" | "diploma" | "school" | "other";
  field: string | null;
  institution: string | null;
  endYear: number | null;
  ongoing: boolean;
}

export interface ExtractedResume {
  id: string;            // short display id, e.g. "AA-4144"
  sourceFile: string;    // file name under /public/resumes
  initials: string | null;
  headline: string | null;
  textLength: number;
  sectionsFound: SectionKey[];
  summary: string | null;
  jobs: Job[];
  projects: Project[];
  education: Education[];
  certifications: string[];
  skills: SkillHit[];
  links: string[];
  experience: {
    totalYears: number | null;               // merged, overlaps counted once
    relevantYears: Record<Role, number | null>;
    sustainabilityYears: number | null;      // broader field (ESG/GHG/etc.)
    claimedYears: number | null;             // "3+ years of experience" in text
    claimedEvidence: string | null;
    internshipOnly: boolean;
  };
  lcaProjectCount: { count: number; evidence: string[] };
  flags: { level: "error" | "warning" | "info"; message: string }[];
  rawText: string;
}

// ───────────────────────── helpers ─────────────────────────

const HEADINGS: [RegExp, SectionKey][] = [
  [/^(work |professional )?experience|^employment( history)?$|^work history$|^internships?$/i, "experience"],
  [/^projects?( \/ deliverables)?$|^(academic |key )?projects$|^case stud(y|ies)$/i, "projects"],
  [/^education|^academic (background|qualifications?)$|^qualifications?$/i, "education"],
  [/^certifications?( & licen[cs]es)?$|^licen[cs]es|^courses?$/i, "certifications"],
  [/^(professional )?summary$|^profile$|^about( me)?$|^objective$/i, "summary"],
  [/^(core |key |technical )?skills$|^competencies$/i, "skills"],
  [/^tools( \/ technologies)?$|^technologies$|^software$/i, "tools"],
  [/^languages?$/i, "languages"],
  [/^awards?( \/ honou?rs)?$|^honou?rs|^achievements$/i, "awards"],
];

function headingOf(line: string): SectionKey | null {
  const t = line.trim().replace(/[:\s]+$/, "");
  if (t.length > 40) return null;
  for (const [re, key] of HEADINGS) if (re.test(t)) return key;
  return null;
}

const clean = (s: string) =>
  s.replace(/\u00a0/g, " ").replace(/[\u200b-\u200d\ufeff]/g, "").replace(/\r/g, "");

const isBullet = (s: string) => /^\s*[•●▪◦\-*–]\s+/.test(s);
const stripBullet = (s: string) => s.replace(/^\s*[•●▪◦\-*–]\s+/, "").trim();

const matchesAny = (text: string, res: RegExp[]) => res.some((r) => r.test(text));

function rolesFor(text: string): Role[] {
  return (Object.keys(ROLE_JOB_SIGNALS) as Role[]).filter((r) => matchesAny(text, ROLE_JOB_SIGNALS[r]));
}

// A date range at the end of a job line, for resumes that don't use the 3-space layout.
const DATE_TOKEN = String.raw`(?:[A-Za-z]{3,9}\.?\s*['’]?\d{2,4}|\d{1,2}/\d{4}|\d{4})`;
const RANGE_AT_END = new RegExp(
  String.raw`(${DATE_TOKEN}\s*(?:[-–—]|to)\s*(?:${DATE_TOKEN}|present|current|ongoing|now|till date))\s*$`, "i");

// ───────────────────────── main ─────────────────────────

export function extractFromText(rawText: string, sourceFile: string, today: YM): ExtractedResume {
  const text = clean(rawText);
  const lines = text.split("\n").map((l) => l.trimEnd()).filter((l) => l.trim() !== "");
  const stem = sourceFile.replace(/^anonymized_/, "").replace(/\.(docx|pdf)$/i, "");
  const [ini, num] = stem.split("_");
  const id = num ? `${ini}-${num.slice(-4)}` : stem.slice(0, 20);

  const flags: ExtractedResume["flags"] = [];
  const out: ExtractedResume = {
    id, sourceFile, initials: null, headline: null, textLength: text.trim().length,
    sectionsFound: [], summary: null, jobs: [], projects: [], education: [], certifications: [],
    skills: [], links: [],
    experience: { totalYears: null, relevantYears: { lca: null, uiux: null }, sustainabilityYears: null,
      claimedYears: null, claimedEvidence: null, internshipOnly: false },
    lcaProjectCount: { count: 0, evidence: [] }, flags, rawText: text,
  };

  if (out.textLength < 50) {
    flags.push({ level: "error", message: "File is empty or unreadable — no text could be extracted. Open the original to check." });
    return out;
  }
  if (out.textLength < 900) flags.push({ level: "warning", message: "Very short resume — little information to score." });

  // 1. Split into sections
  const sections: Record<SectionKey, string[]> = {
    header: [], experience: [], projects: [], education: [], certifications: [], summary: [],
    skills: [], tools: [], languages: [], awards: [], other: [],
  };
  let current: SectionKey = "header";
  for (const l of lines) {
    const h = headingOf(l);
    if (h) { current = h; if (!out.sectionsFound.includes(h)) out.sectionsFound.push(h); continue; }
    sections[current].push(l.trim());
  }
  if (out.sectionsFound.length < 2) flags.push({ level: "warning", message: "Could not find clear sections (Experience, Education…). Extraction may be incomplete." });

  // 2. Header: initials + headline
  const hdr = sections.header;
  if (hdr[0] && /^[A-Z]{1,4}$/.test(hdr[0])) out.initials = hdr[0];
  out.headline = hdr.find((l, i) => i > 0 || !out.initials) ?? null;
  out.summary = sections.summary.join(" ") || null;

  // 3. Jobs
  let job: Job | null = null;
  for (const l of sections.experience) {
    let title: string | null = null, company: string | null = null, dateStr: string | null = null;
    const threeSpace = l.match(/^(.+?)\s{3,}(.+)$/);
    if (!isBullet(l) && threeSpace) { [title, dateStr] = [threeSpace[1], threeSpace[2]]; }
    else if (!isBullet(l)) {
      const m = l.match(RANGE_AT_END);
      if (m) { title = l.slice(0, m.index).replace(/[|,\-–—\s]+$/, ""); dateStr = m[1]; }
    }
    if (title !== null && dateStr !== null) {
      // Split "Title — Company", but not on dashes inside brackets: "Project Associate (UNDP - supported)".
      const masked = title.replace(/\([^)]*\)/g, (m) => m.replace(/[-—–|]/g, "\u0000"));
      const parts = masked.split(/\s+[—–|]\s+|\s+-\s+|\s+at\s+/).map((p) => p.replace(/\u0000/g, "-"));
      const t = parts[0].trim();
      company = parts.slice(1).join(" — ").trim() || null;
      job = { title: t, company, dates: parseRange(dateStr, today), isInternship: /intern|trainee|apprentice/i.test(title),
        bullets: [], relevantTo: [], sustainabilityRelated: false };
      out.jobs.push(job);
    } else if (job) {
      job.bullets.push(stripBullet(l));
    } else if (!isBullet(l)) {
      // A job-like line without dates
      job = { title: l, company: null, dates: parseRange("", today), isInternship: /intern|trainee/i.test(l),
        bullets: [], relevantTo: [], sustainabilityRelated: false };
      out.jobs.push(job);
    }
  }
  for (const j of out.jobs) {
    const blob = [j.title, j.company ?? "", ...j.bullets].join(" ");
    j.relevantTo = rolesFor(blob);
    j.sustainabilityRelated = matchesAny(blob, SUSTAINABILITY_SIGNALS) || j.relevantTo.includes("lca");
    for (const f of j.dates.flags) flags.push({ level: "warning", message: `Job "${j.title}": ${f}` });
  }
  if (!sections.experience.length) flags.push({ level: "info", message: "No Experience section found (may be a fresher)." });

  // 4. Experience years
  const dated = out.jobs.map((j) => j.dates);
  if (out.jobs.length) {
    out.experience.totalYears = monthsToYears(mergedMonths(dated));
    for (const r of ["lca", "uiux"] as Role[])
      out.experience.relevantYears[r] = monthsToYears(mergedMonths(out.jobs.filter((j) => j.relevantTo.includes(r)).map((j) => j.dates)));
    out.experience.sustainabilityYears = monthsToYears(mergedMonths(out.jobs.filter((j) => j.sustainabilityRelated).map((j) => j.dates)));
    out.experience.internshipOnly = out.jobs.every((j) => j.isInternship);
  } else {
    out.experience.totalYears = 0;
    out.experience.relevantYears = { lca: 0, uiux: 0 };
    out.experience.sustainabilityYears = 0;
  }
  if (out.jobs.length && out.jobs.every((j) => j.dates.months === 0))
    flags.push({ level: "warning", message: "No job has readable dates — years of experience could not be calculated." });

  const claim = text.match(/(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+\w+){0,3}?\s+experience/i);
  if (claim) {
    out.experience.claimedYears = parseFloat(claim[1]);
    out.experience.claimedEvidence = claim[0];
    const calc = out.experience.totalYears ?? 0;
    const atLeast = /\+/.test(claim[0]); // "3+ years" = at least 3, so more is consistent
    const conflict = atLeast ? calc < out.experience.claimedYears - 0.5 : Math.abs(calc - out.experience.claimedYears) >= 1.5;
    if (conflict)
      flags.push({ level: "warning", message: `Resume says "${claim[0]}" but job dates add up to ${calc} years.` });
  }

  // 5. Projects (title line followed by description/bullets)
  let proj: Project | null = null;
  for (const l of sections.projects) {
    const looksTitle = !isBullet(l) && l.length <= 90 && !/[.:]$/.test(l) && /^[A-Z0-9"“]/.test(l);
    if (looksTitle && (!proj || proj.description.length > 0)) {
      proj = { title: l, description: "", relevantTo: [] };
      out.projects.push(proj);
    } else if (proj) proj.description += (proj.description ? " " : "") + stripBullet(l);
    else { proj = { title: stripBullet(l).slice(0, 80), description: stripBullet(l), relevantTo: [] }; out.projects.push(proj); }
  }
  for (const p of out.projects) p.relevantTo = rolesFor(`${p.title} ${p.description}`);

  // 6. LCA project count: LCA projects + jobs that did LCA work + explicit "N LCA projects"
  const lcaCore = [/life[\s-]?cycle assessment/i, /\bLCAs?\b/, /\bEPDs?\b/, /\bLCI\b/];
  const ev: string[] = [];
  for (const p of out.projects) if (matchesAny(`${p.title} ${p.description}`, lcaCore)) ev.push(`Project: ${p.title}`);
  for (const j of out.jobs) {
    const b = j.bullets.find((x) => matchesAny(x, lcaCore));
    if (b) ev.push(`Job (${j.title}): ${b.slice(0, 140)}`);
  }
  // "5 LCA projects", "40 EPDs", "12 LCA studies/reports" — each EPD is a completed LCA study.
  const explicit = text.match(/(\d+)\s*\+?\s*(?:(?:LCA|life cycle assessment)s?\s*(?:projects|studies|reports)|EPDs\b)/i);
  const count = Math.max(ev.length, explicit ? +explicit[1] : 0);
  if (explicit) ev.unshift(`Stated: "${explicit[0]}"`);
  out.lcaProjectCount = { count, evidence: ev };

  // 7. Education
  const DEG = /\b(Ph\.?\s?D|Doctor|M\.?\s?Tech|M\.?\s?E\b|M\.?\s?Sc|M\.?\s?S\b|MBA|M\.?\s?Des|M\.?\s?A\b|M\.?\s?Arch|Master|Post ?Graduat\w*|PG\b|PGD\w*|B\.?\s?Tech|B\.?\s?E\b|B\.?\s?Sc|B\.?\s?Des|B\.?\s?A\b|B\.?\s?Arch|B\.?\s?Com|BBA|BCA|Bachelor|Diploma|Class X|XII|HSC|SSC|HSE|SSE|Higher Secondary|Madhyamik|Madhymik|Senior Secondary|Secondary)/i;
  const edu = sections.education;
  // "MS Ramaiah University…" is an institution, not an MS degree (found in review of TM-4495).
  const INST = /universit|college|institut|school|academy/i;
  const isInstitution = (l: string) => INST.test(l) && !/\b(in|of)\b/i.test(l.split(INST)[0]);
  for (let i = 0; i < edu.length; i++) {
    const l = edu[i];
    if (/^(GPA|CGPA|Percentage|Grade)\b/i.test(l) || isInstitution(l)) continue;
    const m = l.match(DEG);
    if (!m) continue;
    const d = m[1].toLowerCase().replace(/[.\s]/g, "");
    // School words first: "Madhyamik" (class 10) starts with "ma" and was read as a Master's.
    const level: Education["level"] =
      /^(classx|xii|hsc|ssc|hse|sse|highersecondary|madhyamik|madhymik|seniorsecondary|secondary)$/.test(d) ? "school" :
      /^(phd|doctor)/.test(d) ? "phd" :
      /^(mtech|me|msc|ms|mba|mdes|ma|march|master|postgrad|pg)/.test(d) ? "master" :
      /^(btech|be|bsc|bdes|ba|barch|bcom|bba|bca|bachelor)/.test(d) ? "bachelor" :
      /^diploma/.test(d) ? "diploma" : "school";
    // Prefer " in X" ("Bachelor of Technology in CS") over " of X", then " – X".
    const fm = l.match(/\bin\s+(.+)$/i) || l.match(/\s[–—-]\s+(.+)$/) || l.match(/\bof\s+(.+)$/i) || l.match(/\(([^)]+)\)/);
    const next = edu[i + 1] && (!DEG.test(edu[i + 1]) || isInstitution(edu[i + 1])) ? edu[i + 1] : null;
    const yearText = `${l} ${next ?? ""}`;
    const years = [...yearText.matchAll(/\b(19|20)\d{2}\b/g)].map((x) => +x[0]);
    const endYear = years.length ? Math.max(...years) : null;
    out.education.push({
      degree: l, level, field: fm ? fm[1].replace(/[,(].*$/, "").trim() : null,
      institution: next ? next.replace(/,?\s*(Expected|Completed)?\s*(in)?\s*(19|20)\d{2}.*$/i, "").trim() || null : null,
      endYear, ongoing: /expected|pursuing|present|ongoing/i.test(yearText) || (endYear !== null && endYear > today.y),
    });
  }
  if (!out.education.length) flags.push({ level: "warning", message: "No degree found in Education section." });
  const LEVEL_ORDER = ["phd", "master", "bachelor", "diploma", "school", "other"];
  out.education.sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level));

  // Designers often describe projects by outcome ("truck aggregator app", "90% task success rate")
  // without the words UI/UX/Figma. For a clear designer profile, product-design words also count.
  // (Found in PV-0171: 4 design projects, 0 recognised.)
  const designerProfile = /design|\bui\b|\bux\b/i.test(out.headline ?? "")
    || out.education.some((e) => /\b(?:B|M)\.?\s?Des\b|design|hci|interaction/i.test(`${e.degree} ${e.field ?? ""}`));
  if (designerProfile) {
    const PRODUCT_DESIGN = /\bapps?\b|dashboard|\busers?\b|screens?\b|interface|onboarding|task success|user journey|usability/i;
    for (const p of out.projects)
      if (!p.relevantTo.includes("uiux") && PRODUCT_DESIGN.test(`${p.title} ${p.description}`)) p.relevantTo.push("uiux");
  }

  out.certifications = sections.certifications.map(stripBullet);

  // 8. Skills with evidence
  const sectionLines: [SectionKey, string][] = (Object.keys(sections) as SectionKey[])
    .flatMap((k) => sections[k].map((l) => [k, stripBullet(l)] as [SectionKey, string]))
    // Skip the initials line: a candidate called "UI" is not a UI skill (found in review of UI-4506).
    .filter(([k, l]) => !(k === "header" && l === out.initials));
  // Job titles live inside "experience" lines too, so they're covered.
  for (const s of SKILLS) {
    const hits = sectionLines.filter(([, l]) => s.patterns.some((p) => p.test(l)));
    if (!hits.length) continue;
    const workSecs: SectionKey[] = ["experience", "projects"];
    const listSecs: SectionKey[] = ["skills", "tools", "header", "summary", "certifications"];
    out.skills.push({
      id: s.id, label: s.label, role: s.role,
      usedInWork: hits.some(([k]) => workSecs.includes(k)),
      listedAsSkill: hits.some(([k]) => listSecs.includes(k)),
      evidence: hits
        .sort(([a], [b]) => (workSecs.includes(b) ? 1 : 0) - (workSecs.includes(a) ? 1 : 0))
        .slice(0, 3)
        .map(([k, l]) => ({ section: k, text: l.length > 220 ? l.slice(0, 217) + "…" : l })),
    });
  }

  // 9. Links
  out.links = Array.from(new Set(text.match(/\b(?:https?:\/\/|www\.)\S+|\b\S+\.(?:behance|dribbble)\.\S+|\b(?:behance|dribbble)\.net\/\S+/gi) ?? []));

  // 10. Data-quality flags
  if (/\bISO\s*[\/,]/.test(text) || /\bISO\s*:\s*\d{4}\/Amd/.test(text) || /\bScope\s+s\b/.test(text))
    flags.push({ level: "info", message: "Some numbers look removed by anonymisation (e.g. \"ISO /, ISO\") — ISO 14040/14044 may be mentioned but unreadable." });
  if (!out.skills.length) flags.push({ level: "warning", message: "No skills from either job description were found." });

  return out;
}

/** Read a .docx or .pdf buffer into plain text. */
export async function bufferToText(buf: Buffer, filename: string): Promise<string> {
  if (/\.docx$/i.test(filename)) {
    const mammoth = (await import("mammoth")).default;
    return (await mammoth.extractRawText({ buffer: buf })).value;
  }
  if (/\.pdf$/i.test(filename)) {
    // unpdf = Mozilla pdf.js packaged for serverless. We rebuild lines from each text item's
    // vertical position, because the extractor relies on one-heading-per-line structure.
    const { getDocumentProxy } = await import("unpdf");
    const doc = await getDocumentProxy(new Uint8Array(buf));
    let out = "";
    for (let p = 1; p <= doc.numPages; p++) {
      const content = await (await doc.getPage(p)).getTextContent();
      let lastY: number | null = null;
      for (const item of content.items) {
        if (!("str" in item)) continue;
        const y = item.transform[5];
        if (lastY !== null && Math.abs(y - lastY) > 2 && !out.endsWith("\n")) out += "\n";
        out += item.str;
        if (item.hasEOL) out += "\n";
        lastY = y;
      }
      out += "\n";
    }
    return out;
  }
  throw new Error("Unsupported file type — please upload a .docx or .pdf");
}
