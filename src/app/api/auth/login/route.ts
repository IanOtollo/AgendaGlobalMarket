import { NextResponse } from "next/server";
import { COOKIE, SESSION_MAX_AGE, createSession } from "@/lib/session";
import { safeEqual, verifyPassword } from "@/server/password";
import { allow, clientIp, sameOrigin } from "@/server/ratelimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const fail = (error: string, status: number, headers?: HeadersInit) =>
  NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store", ...headers } });

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Forbidden", 403);
  if (process.env.ADMIN_AUTH === "open") return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });

  const secret = process.env.SESSION_SECRET;
  const adminEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  if (!secret || secret.length < 32 || !adminEmail || !process.env.ADMIN_PASSWORD_HASH) {
    return fail("Sign-in is not configured on this server.", 503);
  }
  // 8 attempts per 15 minutes per address.
  if (!allow(`login:${clientIp(req)}`, 8, 15 * 60_000)) return fail("Too many attempts. Try again in a few minutes.", 429, { "Retry-After": "900" });

  let body: { email?: unknown; password?: unknown };
  try { body = await req.json(); } catch { return fail("Invalid request", 400); }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password || email.length > 200 || password.length > 200) return fail("Incorrect email or password.", 401);

  // Both checks always run so timing does not reveal which one failed.
  const passwordOk = verifyPassword(password, process.env.ADMIN_PASSWORD_HASH);
  const emailOk = safeEqual(email, adminEmail);
  if (!(passwordOk && emailOk)) return fail("Incorrect email or password.", 401);

  const res = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  res.cookies.set({
    name: COOKIE, value: await createSession(adminEmail, secret),
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_MAX_AGE,
  });
  return res;
}
