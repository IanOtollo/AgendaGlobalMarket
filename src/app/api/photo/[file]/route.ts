import fs from "node:fs";
import path from "node:path";
import { anyApi } from "convex/server";
import { convexConfigured, convexHttp } from "@/server/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };
const headers = (type: string) => ({ "Content-Type": type, "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" });

// Public: worker profile photos the admin chose to upload. Only exact id patterns are accepted, so nothing else is reachable.
export async function GET(_req: Request, { params }: { params: { file: string } }) {
  const local = /^[a-f0-9]{24}.(jpg|png|webp)$/.exec(params.file);
  if (local) {
    try { return new Response(new Uint8Array(fs.readFileSync(path.join(process.cwd(), "data", "uploads", params.file))), { headers: headers(TYPES[local[1]]) }); }
    catch { return new Response("Not found", { status: 404 }); }
  }
  if (convexConfigured() && /^[a-z0-9]{20,48}$/.test(params.file)) {
    try {
      const url = (await convexHttp().query(anyApi.db.photoUrl, { id: params.file })) as string | null;
      const res = url ? await fetch(url) : null;
      const type = res?.headers.get("content-type")?.split(";")[0] ?? "";
      if (res?.ok && Object.values(TYPES).includes(type)) return new Response(await res.arrayBuffer(), { headers: headers(type) });
    } catch { /* fall through */ }
  }
  return new Response("Not found", { status: 404 });
}
