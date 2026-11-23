import { NextResponse } from "next/server";
import { COLLS, applyChanges, getDb, type Changes, type Coll } from "@/server/db";
import { getAdmin, unauthorized } from "@/server/auth";
import { sameOrigin } from "@/server/ratelimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const noStore = { "Cache-Control": "no-store" };
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status, headers: noStore });

// Private business data: admin session required for every method.
export async function GET() {
  if (!(await getAdmin())) return unauthorized();
  return NextResponse.json(await getDb(), { headers: noStore });
}

// Saves only the records that changed. There is no whole-database write and no delete: an out-of-date browser tab
// can therefore never overwrite newer work or make a worker profile disappear.
export async function PATCH(req: Request) {
  if (!(await getAdmin())) return unauthorized();
  if (!sameOrigin(req)) return bad("Forbidden", 403);

  const text = await req.text();
  if (text.length > 2_000_000) return bad("Payload too large", 413);
  let body: { upserts?: unknown; settings?: unknown; by?: unknown };
  try { body = JSON.parse(text); } catch { return bad("Invalid JSON"); }

  const raw = Array.isArray(body.upserts) ? body.upserts : [];
  if (raw.length > 500) return bad("Too many changes at once");
  const upserts: Changes["upserts"] = [];
  for (const u of raw as { coll?: unknown; rid?: unknown; data?: unknown }[]) {
    const data = u?.data as { id?: unknown } | null;
    if (typeof u?.coll !== "string" || !(COLLS as readonly string[]).includes(u.coll)) return bad("Unknown collection");
    if (typeof u.rid !== "string" || !u.rid || u.rid.length > 80) return bad("Invalid record id");
    if (!data || typeof data !== "object" || Array.isArray(data) || data.id !== u.rid) return bad("Invalid record");
    upserts.push({ coll: u.coll as Coll, rid: u.rid, data: data as Record<string, unknown> });
  }
  let settings: Changes["settings"];
  if (body.settings !== undefined) {
    const s = body.settings as { businessName?: unknown; adminPhone?: unknown; trades?: unknown } | null;
    if (!s || typeof s.businessName !== "string" || typeof s.adminPhone !== "string" || (s.trades !== undefined && !Array.isArray(s.trades))) return bad("Invalid settings");
    settings = s as Changes["settings"];
  }
  if (!upserts.length && !settings) return NextResponse.json({ ok: true }, { headers: noStore });
  try {
    await applyChanges({ upserts, settings }, typeof body.by === "string" ? body.by.slice(0, 64) : "admin");
  } catch {
    return bad("Could not save. Try again.", 502);
  }
  return NextResponse.json({ ok: true }, { headers: noStore });
}
