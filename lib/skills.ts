// Skill dictionary: every skill the extractor can recognise.
// Each skill has a canonical id, a human label, the role it belongs to,
// and regex patterns (synonyms / spellings). Acronyms are case-sensitive
// to avoid false hits (e.g. "UI" vs "ui" inside words).

export type Role = "lca" | "uiux";

export interface SkillDef {
  id: string;
  label: string;
  role: Role;
  patterns: RegExp[];
}

const ci = (s: string) => new RegExp(s, "i");
const cs = (s: string) => new RegExp(s);

export const SKILLS: SkillDef[] = [
  // ───────── LCA (JD1) ─────────
  { id: "lca", label: "Life Cycle Assessment (LCA)", role: "lca",
    patterns: [ci("\\blife[\\s-]?cycle (?:assessment|analysis)"), cs("\\bLCAs?\\b")] },
  { id: "lci", label: "Life Cycle Inventory (LCI) data", role: "lca",
    patterns: [ci("\\blife[\\s-]?cycle inventory"), cs("\\bLCI\\b")] },
  { id: "simapro", label: "SimaPro", role: "lca", patterns: [ci("\\bsima\\s?pro\\b")] },
  { id: "gabi", label: "GaBi / Sphera", role: "lca", patterns: [ci("\\bgabi\\b"), ci("\\bsphera\\b")] },
  { id: "openlca", label: "openLCA", role: "lca", patterns: [ci("\\bopen\\s?lca\\b")] },
  { id: "other_lca_tool", label: "Other LCA software (Air.e, Umberto, One Click LCA)", role: "lca",
    patterns: [ci("\\bair\\.e\\b"), ci("\\bumberto\\b"), ci("one click lca")] },
  { id: "ecoinvent", label: "ecoinvent database", role: "lca", patterns: [ci("\\beco\\s?invent\\b")] },
  { id: "iso14040", label: "ISO 14040 / 14044", role: "lca", patterns: [ci("\\bISO\\s*1404[04]")] },
  { id: "epd", label: "Environmental Product Declaration (EPD)", role: "lca",
    patterns: [cs("\\bEPDs?\\b"), ci("environmental product declaration"), cs("\\bPCRs?\\b"), ci("product category rules"), ci("PEP eco")] },
  { id: "lca_method", label: "LCA method (goal & scope, functional unit, system boundary)", role: "lca",
    patterns: [ci("functional unit"), ci("system boundar"), ci("goal and scope"), ci("hotspot")] },
  { id: "carbon_footprint", label: "Carbon footprint / PCF", role: "lca",
    patterns: [ci("carbon footprint"), cs("\\bPCF\\b")] },
  { id: "cradle", label: "Cradle-to-gate / grave scope", role: "lca",
    patterns: [ci("cradle[\\s-]to[\\s-](?:gate|grave|cradle)")] },
  { id: "lcia", label: "Impact assessment (LCIA)", role: "lca",
    patterns: [cs("\\bLCIA\\b"), ci("\\bimpact assessment")] },
  { id: "ghg", label: "GHG accounting (Scope 1-3)", role: "lca",
    patterns: [cs("\\bGHG\\b"), ci("greenhouse gas"), ci("\\bscope\\s*[123]\\b")] },
  { id: "cbam", label: "CBAM", role: "lca", patterns: [cs("\\bCBAM\\b")] },
  { id: "esg", label: "ESG / sustainability reporting", role: "lca",
    patterns: [cs("\\bESG\\b"), cs("\\bBRSR\\b"), cs("\\bGRI\\b"), cs("\\bCDP\\b")] },
  { id: "circular", label: "Circular economy", role: "lca", patterns: [ci("circular economy")] },
  { id: "data_quality", label: "Data collection / validation", role: "lca",
    patterns: [ci("data (?:validation|quality|collection|gaps?)"), ci("validat\\w* (?:\\w+ )?data"),
      ci("(?:gather|collect|compil)\\w* (?:\\w+ ){0,2}data")] },
  { id: "benchmarking", label: "Benchmarking", role: "lca", patterns: [ci("benchmark")] },

  // ───────── UI/UX (JD2) ─────────
  { id: "figma", label: "Figma", role: "uiux", patterns: [ci("\\bfigma\\b")] },
  { id: "prototyping", label: "Prototyping", role: "uiux", patterns: [ci("prototyp")] },
  { id: "wireframing", label: "Wireframing", role: "uiux", patterns: [ci("wire[\\s-]?fram")] },
  { id: "user_research", label: "User research", role: "uiux",
    patterns: [ci("\\b(?:user|ux|design) research"), ci("user interviews?"), ci("contextual inquiry"), ci("research[\\s-]to[\\s-]insight")] },
  // Bare "usability" also appears in engineering text ("improving usability in driving conditions").
  { id: "usability", label: "Usability testing", role: "uiux",
    patterns: [ci("usability (?:test|stud|evaluat|heuristic|research|audit|session|issue|metric)"), ci("a/b test"), ci("heuristic evaluation")] },
  { id: "hcd", label: "Human / user-centred design", role: "uiux",
    patterns: [ci("(?:user|human)[\\s-]cent(?:er|re)d"), ci("design thinking")] },
  { id: "user_flows", label: "User flows / information architecture", role: "uiux",
    patterns: [ci("user flows?"), ci("information architecture"), ci("journey map"), ci("task flows?")] },
  { id: "ui_design", label: "UI / visual design", role: "uiux",
    patterns: [cs("\\bUI\\b"), ci("user interface"), ci("interface design"), ci("visual design")] },
  { id: "ux_design", label: "UX / interaction design", role: "uiux",
    patterns: [cs("\\bUX\\b"), ci("user experience"), ci("interaction design"), ci("experience design")] },
  { id: "design_systems", label: "Design systems", role: "uiux",
    patterns: [ci("design systems?"), ci("style guide"), ci("component librar")] },
  { id: "user_psychology", label: "User psychology / personas", role: "uiux",
    patterns: [ci("personas?\\b"), ci("user psychology"), ci("user behaviou?r"), ci("empathy map"), ci("cognitive")] },
  { id: "adobe_xd", label: "Adobe XD", role: "uiux", patterns: [ci("adobe xd"), cs("\\bXD\\b")] },
  { id: "adobe_suite", label: "Photoshop / Illustrator", role: "uiux", patterns: [ci("photoshop"), ci("illustrator")] },
  { id: "accessibility", label: "Accessibility (WCAG)", role: "uiux", patterns: [ci("accessib"), cs("\\bWCAG\\b")] },
  { id: "responsive", label: "Responsive / mobile design", role: "uiux", patterns: [ci("responsive"), ci("mobile app")] },
  { id: "visual_craft", label: "Typography / visual hierarchy", role: "uiux",
    patterns: [ci("typograph"), ci("visual hierarchy"), ci("colou?r theory"), ci("layout")] },
  { id: "proto_tools", label: "Framer / ProtoPie / Webflow", role: "uiux",
    patterns: [ci("\\bframer\\b"), ci("protopie"), ci("webflow")] },
  { id: "portfolio", label: "Portfolio (Behance / Dribbble)", role: "uiux",
    // Not bare "portfolio": finance resumes say "multi-product portfolio".
    patterns: [ci("(?:design|ux|ui|creative|personal) portfolio"), ci("portfolio (?:website|link|site)"), ci("behance"), ci("dribbble")] },
];

/** Words that make a job "relevant" to a role when computing relevant years. */
export const ROLE_JOB_SIGNALS: Record<Role, RegExp[]> = {
  lca: [ci("life[\\s-]?cycle"), cs("\\bLCA"), cs("\\bLCI\\b"), ci("sima\\s?pro"), ci("\\bgabi\\b"),
        cs("\\bEPD"), ci("carbon footprint"), ci("cradle[\\s-]to")],
  // "product designer" (job title), not "product design" — engineers also "develop product designs".
  uiux: [cs("\\bUI\\b"), cs("\\bUX\\b"), ci("user experience"), ci("product designer\\b"), ci("figma"),
         ci("wirefram"), ci("prototyp"), ci("interaction design"), ci("user research")],
};

/** Broader "same field" signals (sustainability) — reported, lower weight later. */
export const SUSTAINABILITY_SIGNALS: RegExp[] = [
  cs("\\bESG\\b"), cs("\\bGHG\\b"), ci("sustainab"), ci("carbon"), ci("emission"), cs("\\bCBAM\\b"),
  ci("climate"), ci("environment"),
  ci("circular economy"), ci("decarboni"), // added after manual review of VM-4520 (applies to all)
];
