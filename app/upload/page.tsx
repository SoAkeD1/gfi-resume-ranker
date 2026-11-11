"use client";
import { useRef, useState } from "react";
import type { Result } from "@/lib/types";
import { CandidateView } from "@/components/CandidateView";
import { Card, LabelBadge } from "@/components/ui";

type State =
  | { kind: "idle" }
  | { kind: "loading"; name: string }
  | { kind: "error"; message: string }
  | { kind: "done"; result: Result; pileSize: number; name: string };

export default function UploadPage() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function send(file: File) {
    setState({ kind: "loading", name: file.name });
    const body = new FormData();
    body.append("file", file);
    try {
      const res = await fetch("/api/rank", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) return setState({ kind: "error", message: json.error ?? "Something went wrong." });
      setState({ kind: "done", result: json.result, pileSize: json.pileSize, name: file.name });
    } catch {
      setState({ kind: "error", message: "Could not reach the server. Check your connection and try again." });
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Upload a resume</h1>
        <p className="mt-1 text-sm text-slate-600">
          See how a new resume scores for both jobs and where it would rank among the resumes already in the pile.
          It is scored with exactly the same rules. The file is not saved.
        </p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) send(f); }}
        className={`rounded-xl border-2 border-dashed p-10 text-center transition ${drag ? "border-emerald-500 bg-emerald-50" : "border-slate-300 bg-white"}`}
      >
        <p className="text-lg font-medium text-slate-800">Drag a resume here</p>
        <p className="mt-1 text-sm text-slate-500">Word (.docx) or PDF, up to 4 MB</p>
        <button onClick={() => input.current?.click()} disabled={state.kind === "loading"}
          className="mt-4 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
          {state.kind === "loading" ? "Reading…" : "Choose a file"}
        </button>
        <input ref={input} type="file" accept=".docx,.pdf" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) send(f); e.target.value = ""; }} />
      </div>

      {state.kind === "loading" && <p className="text-sm text-slate-600" role="status">Reading and scoring “{state.name}”…</p>}
      {state.kind === "error" && <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{state.message}</p>}

      {state.kind === "done" && (
        <>
          <Card className="border-emerald-300">
            <p className="text-sm text-slate-500">Result for “{state.name}”</p>
            <div className="mt-2 grid gap-4 sm:grid-cols-3">
              <RankBox title="LCA Consultant" rank={state.result.rank.lca} of={state.pileSize + 1} score={state.result.scores.lca.total} />
              <RankBox title="UI/UX Design Intern" rank={state.result.rank.uiux} of={state.pileSize + 1} score={state.result.scores.uiux.total} />
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Best fit</div>
                <div className="mt-1"><LabelBadge label={state.result.classification.label} /></div>
                <p className="mt-1 text-xs text-slate-600">{state.result.classification.reason}</p>
              </div>
            </div>
          </Card>
          <CandidateView r={state.result} role={state.result.scores.uiux.total > state.result.scores.lca.total ? "uiux" : "lca"} total={state.pileSize + 1} uploaded />
        </>
      )}
    </div>
  );
}

function RankBox({ title, rank, of, score }: { title: string; rank: number; of: number; score: number }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="text-xs text-slate-500">{title}</div>
      <div className="text-2xl font-semibold text-slate-900">#{rank} <span className="text-sm font-normal text-slate-500">of {of}</span></div>
      <div className="text-sm text-slate-600">Score {score}/100</div>
    </div>
  );
}
