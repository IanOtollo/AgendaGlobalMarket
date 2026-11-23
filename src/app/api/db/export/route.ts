import { getDb } from "@/server/db";
import { getAdmin, unauthorized } from "@/server/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Admin only: a complete copy of the business data as one JSON file, for safekeeping.
export async function GET() {
  if (!(await getAdmin())) return unauthorized();
  const db = await getDb();
  const day = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify({ exportedAt: new Date().toISOString(), ...db }, null, 2), {
    headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="agenda-backup-${day}.json"`, "Cache-Control": "no-store" },
  });
}
