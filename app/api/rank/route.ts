// POST /api/rank — upload one resume (.docx or .pdf), get its scores and where it would rank.
// Uses exactly the same extract → score → classify code as the 47-resume pile. Nothing is stored.
import { NextResponse } from "next/server";
import { bufferToText, extractFromText } from "@/lib/extract";
import { scoreBoth } from "@/lib/score";
import { classify, degreeRank, rankInPile } from "@/lib/classify";
import { PILE_RANK_ITEMS, RESULTS } from "@/lib/data";
import { REFERENCE_DATE } from "@/config/jobs";
import type { Result } from "@/lib/types";
import type { Role } from "@/lib/skills";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 4 * 1024 * 1024; // Vercel free tier body limit is ~4.5 MB

export async function POST(req: Request) {
  let form: FormData;
  try { form = await req.formData(); } catch { return fail("Please choose a file to upload."); }
  const file = form.get("file");
  if (!(file instanceof File)) return fail("Please choose a file to upload.");
  if (!/\.(docx|pdf)$/i.test(file.name)) return fail("Only Word (.docx) or PDF files can be read. Please save the resume in one of those formats.");
  if (file.size > MAX_BYTES) return fail("This file is larger than 4 MB. Please upload a smaller file.");

  let text = "";
  try {
    text = await bufferToText(Buffer.from(await file.arrayBuffer()), file.name);
  } catch {
    // Keep going with empty text: the extractor will flag it as unreadable instead of crashing.
    text = "";
  }

  const safeName = file.name.replace(/[^\w.\- ]+/g, "_").slice(0, 80);
  const extracted = extractFromText(text, `uploaded_${safeName}`, REFERENCE_DATE);
  extracted.id = "NEW";
  const scores = scoreBoth(extracted);
  const classification = classify(extracted, scores);

  // Where it would rank: same order as the pile (score, then higher degree, then relevant years).
  const rank = Object.fromEntries((["lca", "uiux"] as Role[]).map((role) => [role, rankInPile(
    { score: scores[role].total, degree: degreeRank(extracted), years: extracted.experience.relevantYears[role] ?? 0 },
    PILE_RANK_ITEMS[role],
  )])) as Record<Role, number>;

  // Same resume already in the pile?
  const norm = (s: string) => s.replace(/\s+/g, " ").trim().slice(0, 600);
  const dup = text.trim().length > 50 ? RESULTS.find((r) => norm(r.textPreview).slice(0, 300) === norm(text).slice(0, 300)) : undefined;
  if (dup) extracted.flags.push({ level: "info", message: `This looks like the same resume as ${dup.id}, which is already in the pile.` });

  const { rawText, ...rest } = extracted;
  const result: Result = {
    ...rest, textPreview: rawText.slice(0, 400), scores, classification, rank,
    review: { status: "not reviewed", notes: null, changes: [] },
  };
  return NextResponse.json({ result, pileSize: RESULTS.length });
}

function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
