"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Result } from "@/lib/types";
import { CandidateView } from "@/components/CandidateView";
import { BTN, Eyebrow, LabelBadge, scoreHex } from "@/components/ui";

type State =
  | { kind: "idle" }
  | { kind: "loading"; name: string; size: number }
  | { kind: "error"; message: string }
  | { kind: "done"; result: Result; pileSize: number; name: string; size: number };

const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export default function UploadPage() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [drag, setDrag] = useState(false);
  const [step, setStep] = useState(0); // 0 reading · 1 scoring · 2 done
  const input = useRef<HTMLInputElement>(null);

  // While waiting, move the progress from "Reading" to "Scoring" so it doesn't look stuck.
  useEffect(() => {
    if (state.kind !== "loading") return;
    setStep(0);
    const t = setTimeout(() => setStep(1), 500);
    return () => clearTimeout(t);
  }, [state.kind]);

  async function send(file: File) {
    setState({ kind: "loading", name: file.name, size: file.size });
    const body = new FormData();
    body.append("file", file);
    try {
      const res = await fetch("/api/rank", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) return setState({ kind: "error", message: json.error ?? "Something went wrong." });
      setStep(2);
      setState({ kind: "done", result: json.result, pileSize: json.pileSize, name: file.name, size: file.size });
    } catch {
      setState({ kind: "error", message: "Could not reach the server. Check your connection and try again." });
    }
  }

  const busy = state.kind === "loading";
  const best = state.kind === "done" ? Math.max(state.result.scores.lca.total, state.result.scores.uiux.total) : 0;

  return (
    <div className="mx-auto max-w-[1040px] space-y-6">
      <div>
        <Eyebrow>Try a new candidate</Eyebrow>
        <h1 className="font-display text-4xl font-semibold tracking-[-0.02em] sm:text-[44px]">Upload a resume</h1>
        <p className="mt-2.5 max-w-[640px] text-base leading-relaxed text-ink-muted">
          See how it scores for both jobs and where it would land in the pile. Same rules as everyone else. The file is not saved.
        </p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f && !busy) send(f); }}
        className={`group flex flex-col items-center justify-center gap-2.5 rounded-3xl border-2 border-dashed px-6 py-12 text-center transition duration-200 ${drag ? "scale-[1.01] border-forest bg-forest-pale" : `bg-white ${busy ? "border-line-strong" : "anim-breathe border-[#C9C5BB]"}`}`}
      >
        <svg width="120" height="84" viewBox="0 0 120 84" aria-hidden="true" className={`transition-transform duration-300 ${drag ? "-translate-y-1.5" : "group-hover:-translate-y-1"}`}>
          <rect x="34" y="8" width="52" height="66" rx="8" fill="#FBFAF7" stroke="#1E5B44" strokeWidth="1.6" />
          <path d="M44 26h32M44 36h32M44 46h20" stroke="#B9D3C4" strokeWidth="2" strokeLinecap="round" />
          <path d="M86 52 C100 46 108 34 110 20 C96 22 86 32 86 52 Z" fill="#E8F1EC" stroke="#1E5B44" strokeWidth="1.4" />
          <path d="M14 70 C24 60 40 66 52 58" fill="none" stroke="#1E5B44" strokeWidth="1.2" opacity="0.4" />
        </svg>
        <p className="font-display text-2xl font-semibold">{drag ? "Drop it to score" : "Drag a resume here"}</p>
        <p className="text-sm text-ink-subtle">Word (.docx) or PDF · up to 4 MB</p>
        <button type="button" onClick={() => input.current?.click()} disabled={busy} className={`${BTN.primary} mt-2 px-6 text-[15px]`}>
          {busy ? <><Spinner /> Reading…</> : "Choose a file"}
        </button>
        <input ref={input} type="file" accept=".docx,.pdf" className="sr-only" aria-label="Choose a resume file"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) send(f); e.target.value = ""; }} />
      </div>

      {(state.kind === "loading" || state.kind === "done") && (
        <ol aria-label="Progress" className="flex flex-wrap items-center gap-3 text-sm" role="status">
          {["Reading", "Scoring", "Done"].map((s, i) => {
            const done = step > i || (state.kind === "done");
            const current = !done && step === i;
            return (
              <li key={s} className="flex items-center gap-3">
                {i > 0 && <span aria-hidden="true" className={`h-0.5 w-12 rounded ${done || current ? "bg-forest" : "bg-line"}`} />}
                <span className={`flex items-center gap-2 font-semibold ${done || current ? "text-forest" : "text-ink-subtle"}`}>
                  <span className={`grid h-[26px] w-[26px] place-items-center rounded-full text-[13px] ${done ? "bg-forest text-white" : current ? "border-2 border-forest" : "border border-line-strong"}`}>
                    {done ? "✓" : current ? <Spinner dark /> : i + 1}
                  </span>
                  {s}
                </span>
              </li>
            );
          })}
          <li className="ml-auto text-ink-subtle">{state.name} · {kb(state.size)}</li>
        </ol>
      )}

      {state.kind === "error" && (
        <p role="alert" className="rounded-2xl border border-rust-line bg-rust-tint px-4 py-3.5 text-sm leading-relaxed text-rust-text">{state.message}</p>
      )}

      {state.kind === "done" && (
        <>
          <section className="anim-rise relative rounded-3xl border border-forest-ring bg-white p-6 shadow-[0_18px_40px_rgba(23,32,27,.06)] sm:p-7">
            {best >= 70 && (
              <svg width="140" height="90" viewBox="0 0 140 90" aria-hidden="true" className="pointer-events-none absolute -top-5 left-28">
                <path className="anim-leaf" d="M20 70 C20 58 28 50 40 50 C40 62 32 70 20 70 Z" fill="#8DB5A0" />
                <path className="anim-leaf" style={{ animationDelay: "120ms" }} d="M70 60 C70 50 76 44 86 44 C86 54 80 60 70 60 Z" fill="#1E5B44" />
                <path className="anim-leaf" style={{ animationDelay: "240ms" }} d="M110 72 C110 62 116 56 126 56 C126 66 120 72 110 72 Z" fill="#B9D3C4" />
              </svg>
            )}
            <p className="text-sm text-ink-subtle">Result for “{state.name}”</p>
            <div className="mt-3.5 grid gap-4 md:grid-cols-3">
              <RankTile title="LCA Consultant" tone="text-forest" rank={state.result.rank.lca} of={state.pileSize + 1} score={state.result.scores.lca.total} role="lca" />
              <RankTile title="UI/UX Design Intern" tone="text-plum" rank={state.result.rank.uiux} of={state.pileSize + 1} score={state.result.scores.uiux.total} role="uiux" />
              <div className="rounded-[18px] border border-line-soft bg-soft p-5">
                <div className="text-[13px] font-semibold text-ink-2">Best fit</div>
                <div className="mt-2.5"><LabelBadge label={state.result.classification.label} size="md" /></div>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">{state.result.classification.reason}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <a href="#breakdown" className={BTN.primary}>See the full breakdown <span className="arrow">→</span></a>
              <button type="button" onClick={() => { setState({ kind: "idle" }); input.current?.click(); }} className={BTN.quiet}>Upload another</button>
              <Link href="/" className={BTN.quiet}>Back to rankings</Link>
            </div>
          </section>
          <div id="breakdown" className="scroll-mt-6">
            <CandidateView r={state.result} role={state.result.scores.uiux.total > state.result.scores.lca.total ? "uiux" : "lca"} total={state.pileSize + 1} uploaded />
          </div>
        </>
      )}
    </div>
  );
}

function RankTile({ title, tone, rank, of, score, role }: { title: string; tone: string; rank: number; of: number; score: number; role: "lca" | "uiux" }) {
  const strong = score >= 50;
  return (
    <div className={`rounded-[18px] border p-5 ${strong ? (role === "lca" ? "border-forest-ring bg-forest-pale" : "border-[#DCD3F2] bg-[#F7F4FD]") : "border-line-soft bg-soft"}`}>
      <div className={`text-[13px] font-semibold ${tone}`}>{title}</div>
      <div className={`mt-1.5 font-display text-[56px] font-semibold leading-none tabular-nums ${strong ? "text-ink" : "text-ink-muted"}`}>
        #{rank} <span className="font-sans text-base font-normal text-ink-subtle">of {of}</span>
      </div>
      <div className="mt-3 flex items-center gap-2.5">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-line-soft">
          <div className="anim-fill h-full rounded-full" style={{ width: `${score}%`, background: scoreHex(score, role), animationDelay: "250ms" }} />
        </div>
        <b className="font-display text-lg">{score}</b>
      </div>
    </div>
  );
}

function Spinner({ dark = false }: { dark?: boolean }) {
  return (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6" fill="none" stroke={dark ? "#CFE3D7" : "rgba(255,255,255,.3)"} strokeWidth="2" />
      <path d="M8 2a6 6 0 0 1 6 6" fill="none" stroke={dark ? "#1E5B44" : "#FFFFFF"} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
