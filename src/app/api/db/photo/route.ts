import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getAdmin, unauthorized } from "@/server/auth";
import { sameOrigin } from "@/server/ratelimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const noStore = { "Cache-Control": "no-store" };
const MAX = 2 * 1024 * 1024;
const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

/** Detects the real image type from the first bytes, so a renamed file can't slip through. */
function sniff(b: Buffer): "jpg" | "png" | "webp" | null {
  if (b.length > 12 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b.length > 12 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (b.length > 12 && b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
  return null;
}

// Admin only. Optional worker photo: JPG, PNG or WebP up to 2 MB. Returns the public URL to store on the worker.
export async function POST(req: Request) {
  if (!(await getAdmin())) return unauthorized();
  if (!sameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: noStore });
  let file: File | null = null;
  try { const f = (await req.formData()).get("file"); file = f instanceof File ? f : null; } catch { /* fallthrough */ }
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400, headers: noStore });
  if (file.size > MAX) return NextResponse.json({ error: "Photo must be 2 MB or smaller" }, { status: 413, headers: noStore });
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = sniff(buf);
  if (!ext) return NextResponse.json({ error: "Use a JPG, PNG or WebP photo" }, { status: 415, headers: noStore });
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const name = `${randomBytes(12).toString("hex")}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
  return NextResponse.json({ url: `/api/photo/${name}` }, { headers: noStore });
}
