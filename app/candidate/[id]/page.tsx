import Link from "next/link";
import { notFound } from "next/navigation";
import { RESULTS, getResult } from "@/lib/data";
import { CandidateView } from "@/components/CandidateView";
import type { Role } from "@/lib/skills";

// Only the 47 known IDs exist; anything else is a real 404 (not a streamed 200 page).
export const dynamicParams = false;

export function generateStaticParams() {
  return RESULTS.map((r) => ({ id: r.id }));
}

export function generateMetadata({ params }: { params: { id: string } }) {
  return { title: `${params.id} — Resume Ranker` };
}

export default function CandidatePage({ params, searchParams }: { params: { id: string }; searchParams: { role?: string } }) {
  const r = getResult(decodeURIComponent(params.id));
  if (!r) notFound();
  const role: Role = searchParams.role === "uiux" ? "uiux" : searchParams.role === "lca" ? "lca" : r.scores.uiux.total > r.scores.lca.total ? "uiux" : "lca";
  return (
    <div>
      <Link href={`/?role=${role}`} className="mb-5 inline-flex min-h-[36px] items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        ← Back to {role === "lca" ? "LCA" : "UI/UX"} rankings
      </Link>
      <CandidateView r={r} role={role} total={RESULTS.length} />
    </div>
  );
}
