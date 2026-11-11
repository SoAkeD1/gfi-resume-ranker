// Small presentational pieces shared by every page (safe for server and client).
import type { Label } from "@/lib/classify";
import type { Role } from "@/lib/skills";

// ───────── labels ─────────
const LABEL_STYLE: Record<Label, string> = {
  LCA: "bg-forest-tint text-forest",
  "UI/UX": "bg-plum-tint text-plum-text",
  Both: "bg-note-tint text-note-text",
  Neither: "bg-line-soft text-ink-muted",
  Uncertain: "bg-ochre-tint text-ochre",
};

export const LABEL_TEXT: Record<Label, string> = {
  LCA: "Fits LCA",
  "UI/UX": "Fits UI/UX",
  Both: "Fits both",
  Neither: "Fits neither",
  Uncertain: "Needs a look",
};

/** Text colour that matches each label, for counters and selected chips. */
export const LABEL_INK: Record<Label, string> = {
  LCA: "text-forest", "UI/UX": "text-plum-text", Both: "text-note-text", Neither: "text-ink-muted", Uncertain: "text-ochre",
};

export function LabelBadge({ label, size = "sm" }: { label: Label; size?: "sm" | "md" }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full font-semibold ${size === "md" ? "px-3 py-1.5 text-[13px]" : "px-2.5 py-1 text-xs"} ${LABEL_STYLE[label]}`}>
      {LABEL_TEXT[label]}
    </span>
  );
}

// ───────── colours ─────────
export const ROLE_HEX: Record<Role, string> = { lca: "#1E5B44", uiux: "#5A3EA6" };

/** Bar colour on the 0–100 scale; 70+ uses the job's own colour. */
export function scoreHex(pct: number, role: Role = "lca") {
  return pct >= 70 ? ROLE_HEX[role] : pct >= 50 ? "#7FA338" : pct >= 30 ? "#D69A2D" : "#C9C5BB";
}

// ───────── score visuals ─────────
/** Horizontal bar that fills on first view, with the number beside it. */
export function ScoreBar({ value, max = 100, role = "lca", delay = 0, barClass = "w-28", showMax = true, showValue = true }:
  { value: number; max?: number; role?: Role; delay?: number; barClass?: string; showMax?: boolean; showValue?: boolean }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="flex items-center gap-3">
      <div className={`h-2 ${barClass} overflow-hidden rounded-full bg-line-soft`} role="img" aria-label={`${value} out of ${max}`}>
        <div className="anim-fill h-full rounded-full" style={{ width: `${pct}%`, background: scoreHex(pct, role), animationDelay: `${delay}ms` }} />
      </div>
      {showValue && (
        <span className="shrink-0 font-display text-lg font-semibold tabular-nums text-ink">
          {value}{showMax && <span className="font-sans text-xs font-normal text-ink-subtle"> / {max}</span>}
        </span>
      )}
    </div>
  );
}

/** Round score ring that draws itself on first view. */
export function ScoreRing({ value, role = "lca", size = 112 }: { value: number; role?: Role; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" role="img" aria-label={`${value} out of 100`} className="shrink-0">
      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#EEECE6" strokeWidth="3" />
      <circle className="anim-draw" cx="18" cy="18" r="15.9" fill="none" stroke={scoreHex(value, role)} strokeWidth="3"
        strokeLinecap="round" pathLength={100} strokeDasharray={`${Math.max(value, 0.01)} 100`} transform="rotate(-90 18 18)" />
      <text x="18" y="19.6" textAnchor="middle" fontFamily="var(--font-display), Georgia, serif" fontSize="8.6" fontWeight="600" fill="#17201B">{value}</text>
      <text x="18" y="25" textAnchor="middle" fontFamily="var(--font-sans), sans-serif" fontSize="2.9" fill="#5A625C">of 100</text>
    </svg>
  );
}

const MEDAL = ["#B8902B", "#8E9AA3", "#A8693A"];
/** Rank number; the top 3 get a thin gold / silver / bronze ring. */
export function RankMark({ rank, size = 40 }: { rank: number; size?: number }) {
  const medal = MEDAL[rank - 1];
  return (
    <span className={`inline-grid shrink-0 place-items-center rounded-full font-display font-semibold ${medal ? "text-ink" : "bg-stone text-ink-subtle"}`}
      style={{ width: size, height: size, fontSize: size * 0.4, border: medal ? `1.5px solid ${medal}` : undefined }}
      title={medal ? `Top ${rank}` : undefined}>
      #{rank}
    </span>
  );
}

// ───────── containers & small marks ─────────
export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[20px] border border-line bg-white p-6 ${className}`}>{children}</section>;
}

export function Eyebrow({ children, className = "text-forest" }: { children: React.ReactNode; className?: string }) {
  return <p className={`mb-2 text-xs font-semibold uppercase tracking-[0.08em] ${className}`}>{children}</p>;
}

export function ReviewedTick({ reviewed }: { reviewed: boolean }) {
  return reviewed
    ? <span title="Extracted data checked by a person" className="whitespace-nowrap text-xs font-medium text-forest">✓ checked</span>
    : <span title="Not yet checked by a person" className="text-xs text-ink-subtle">—</span>;
}

export function FlagIcon({ count, error }: { count: number; error?: boolean }) {
  if (!count) return <span className="text-line-strong" aria-label="No problems">—</span>;
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold ${error ? "text-rust" : "text-ochre"}`}
      title={`${count} data problem(s) — open the candidate to see them`}>
      ⚠ {count}
    </span>
  );
}

/** Logo mark: a leaf over a ranking stroke. */
export function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" aria-hidden="true">
      <rect width="34" height="34" rx="9" fill="#1E5B44" />
      <path d="M9 24 C9 15 15 9 25 9 C25 19 19 25 9 24 Z" fill="none" stroke="#E8F1EC" strokeWidth="1.8" />
      <path d="M10 23 L20 13" stroke="#E8F1EC" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Faint topographic lines used as the only decoration. */
export function Contours({ className = "", color = "#1E5B44" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 520 200" aria-hidden="true" className={`pointer-events-none ${className}`}>
      {[0, 15, 30, 45, 60].map((o) => (
        <path key={o} d={`M10 ${175 - o} C120 ${105 - o} 220 ${205 - o} 330 ${125 - o} S500 ${75 - o} 520 ${105 - o}`} fill="none" stroke={color} strokeWidth="1.4" />
      ))}
    </svg>
  );
}

// ───────── buttons (class strings so <a>, <Link> and <button> share them) ─────────
export const BTN = {
  primary: "btn-lift sheen inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-forest px-5 text-sm font-semibold text-white shadow-inset hover:bg-forest-dark active:bg-forest-deep disabled:cursor-not-allowed disabled:bg-[#C9D6CE] disabled:text-ink-muted",
  secondary: "btn-lift inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-forest bg-white px-5 text-sm font-semibold text-forest hover:bg-forest-pale active:bg-forest-tint",
  quiet: "btn-lift inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-line-strong bg-white px-5 text-sm text-ink-2 hover:bg-soft",
};
