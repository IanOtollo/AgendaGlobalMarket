import { NextResponse } from "next/server";
import { addContactRequest } from "@/server/db";
import { allow, clientIp, sameOrigin } from "@/server/ratelimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const headers = { "Cache-Control": "no-store" };
const fail = (error: string, status: number) => NextResponse.json({ error }, { status, headers });

/** One line of plain text: control characters removed, spaces collapsed, length capped. */
const line = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "");
/** A short message: keeps line breaks, removes other control characters, length capped. */
const text = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, max) : "");

// Public. The only thing it can do is add one new request for the office to follow up. It returns nothing but "ok".
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Forbidden", 403);
  if (!allow(`contact:${clientIp(req)}`, 5, 10 * 60_000) || !allow("contact:all", 120, 60 * 60_000)) return fail("Too many requests. Please try again in a few minutes.", 429);

  let b: Record<string, unknown>;
  try { b = (await req.json()) as Record<string, unknown>; } catch { return fail("Invalid request", 400); }
  if (typeof b !== "object" || b === null) return fail("Invalid request", 400);

  // Hidden field that people never see: if something filled it in, it is a bot. Pretend it worked.
  if (line(b.company, 50)) return NextResponse.json({ ok: true }, { headers });

  const name = line(b.name, 80);
  // One box for either: an "@" makes it an email, anything else must be a phone number.
  const contact = line(b.contact ?? b.phone ?? b.email, 120);
  const isEmail = contact.includes("@");
  const phone = isEmail ? "" : contact;
  const email = isEmail ? contact : "";
  const category = line(b.service, 80);
  const address = line(b.area, 80);
  const description = text(b.message, 1000);

  if (!name) return fail("Please add your name.", 400);
  if (!contact) return fail("Please add a phone number or email the office can reach you on.", 400);
  if (isEmail) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fail("That email address does not look right.", 400);
  } else {
    const digits = phone.replace(/\D/g, "");
    if (!/^[0-9+()\-\s.]+$/.test(phone) || digits.length < 7 || digits.length > 15) return fail("Please add a phone number or email the office can reach you on.", 400);
  }
  if (!category && !description) return fail("Tell us what you need.", 400);

  const result = await addContactRequest({ name, phone, ...(email ? { email } : {}), category, address, description });
  if (result === "unavailable") return fail("We cannot take messages right now. Please call the office.", 503);
  return NextResponse.json({ ok: true }, { headers });
}
