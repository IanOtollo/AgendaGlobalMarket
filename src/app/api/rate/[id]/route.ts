import { NextResponse } from "next/server";
import { addRatingToJob, getDb } from "@/server/db";
import { allow, clientIp, sameOrigin } from "@/server/ratelimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const headers = { "Cache-Control": "no-store" };

// Public. Reveals only what the rating page needs; a missing job and a not-yet-completed job look identical.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  if (!allow(`rate-get:${clientIp(req)}`, 40, 10 * 60_000)) return NextResponse.json({ state: "unavailable" }, { status: 429, headers });
  const db = getDb();
  const wo = db.workOrders.find((w) => w.id === params.id);
  if (!wo || wo.status !== "completed" || !wo.providerId) return NextResponse.json({ state: "unavailable" }, { headers });
  if (db.ratings.some((r) => r.workOrderId === wo.id)) return NextResponse.json({ state: "done" }, { headers });
  const pro = db.providers.find((p) => p.id === wo.providerId);
  return NextResponse.json({ state: "ready", providerName: pro?.name ?? "your professional", jobTitle: wo.title }, { headers });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers });
  if (!allow(`rate-post:${clientIp(req)}`, 10, 10 * 60_000)) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers });

  let body: { stars?: unknown; comment?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400, headers }); }
  const stars = body.stars;
  const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 500) : "";
  if (typeof stars !== "number" || !Number.isInteger(stars) || stars < 1 || stars > 5) {
    return NextResponse.json({ error: "Stars must be a whole number from 1 to 5" }, { status: 400, headers });
  }
  const result = addRatingToJob(params.id, stars, comment);
  if (result === "unavailable") return NextResponse.json({ error: "Not available" }, { status: 404, headers });
  if (result === "already_rated") return NextResponse.json({ error: "Already rated" }, { status: 409, headers });
  return NextResponse.json({ ok: true }, { headers });
}
