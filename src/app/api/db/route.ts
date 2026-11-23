import { NextResponse } from "next/server";
import { getDb, setDb } from "@/server/db";
import { getAdmin, unauthorized } from "@/server/auth";
import { sameOrigin } from "@/server/ratelimit";
import type { DB } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const noStore = { "Cache-Control": "no-store" };

// Private business data: admin session required for every method.
export async function GET() {
  if (!(await getAdmin())) return unauthorized();
  return NextResponse.json(getDb(), { headers: noStore });
}

export async function PUT(req: Request) {
  if (!(await getAdmin())) return unauthorized();
  if (!sameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: noStore });

  const text = await req.text();
  if (text.length > 5_000_000) return NextResponse.json({ error: "Payload too large" }, { status: 413, headers: noStore });
  let parsed: { db?: DB; by?: unknown };
  try { parsed = JSON.parse(text); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: noStore }); }
  const { db, by } = parsed;
  if (!db || !Array.isArray(db.workOrders) || !Array.isArray(db.providers) || !Array.isArray(db.customers) || !Array.isArray(db.ratings)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400, headers: noStore });
  }
  setDb(db, typeof by === "string" ? by.slice(0, 64) : "admin");
  return NextResponse.json({ ok: true }, { headers: noStore });
}
