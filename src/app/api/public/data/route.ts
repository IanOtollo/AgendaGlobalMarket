import { NextResponse } from "next/server";
import { getPublicPros, getPublicSettings } from "@/server/public";
import { allow, clientIp } from "@/server/ratelimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// The live public data (professionals and the admin line), built from the public read model only. Shared caches may keep it
// for 30 seconds, so a burst of visitors costs the database almost nothing.
export async function GET(req: Request) {
  if (!allow(`pub-data:${clientIp(req)}`, 120, 10 * 60_000)) return new Response("Too many requests", { status: 429 });
  try {
    const [pros, settings] = await Promise.all([getPublicPros(), getPublicSettings()]);
    return NextResponse.json({ pros, settings }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } });
  } catch {
    return new Response("Temporarily unavailable", { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "10" } });
  }
}
