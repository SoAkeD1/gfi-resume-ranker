import Link from "next/link";
import { notFound } from "next/navigation";
import { RESULTS, getResult } from "@/lib/data";
import { CandidateView } from "@/components/CandidateView";
import type { Role } from "@/lib/skills";

export function generateStaticParams() {
  return RESULTS.map((r) => ({ id: r.id }));
}

export function generateMetadata({ params }: { params: { id: string } }) {
  return { title: `${params.id} — Resume Ranker` };
}

export default function CandidatePage({ params, searchParams }: { params: { id: string }; searchParams: { role?: string } }) {
  const r = getResult(decodeURIComponent(params.id));
  if (!r) notFound();
  const role: Role = searchParams.role === "uiux" ? "uiux" : r.scores.uiux.total > r.scores.lca.total ? "uiux" : "lca";
  return (
    <div>
      <Link href={`/?role=${role}`} className="mb-4 inline-block text-sm text-slate-600 hover:text-slate-900">← Back to rankings</Link>
      <CandidateView r={r} role={role} total={RESULTS.length} />
    </div>
  );
}
