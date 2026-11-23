import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

// Public: worker profile photos the admin chose to upload. The name must match the exact generated pattern, so nothing else on disk is reachable.
export async function GET(_req: Request, { params }: { params: { file: string } }) {
  const m = /^[a-f0-9]{24}\.(jpg|png|webp)$/.exec(params.file);
  if (!m) return new Response("Not found", { status: 404 });
  try {
    const data = fs.readFileSync(path.join(process.cwd(), "data", "uploads", params.file));
    return new Response(new Uint8Array(data), { headers: { "Content-Type": TYPES[m[1]], "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" } });
  } catch { return new Response("Not found", { status: 404 }); }
}
