import { cookies } from "next/headers";
import { COOKIE, verifySession } from "@/lib/session";

// Returns the signed-in admin, or null. Also requires the session to belong to the configured admin email.
export async function getAdmin() {
  // Temporary open mode (ADMIN_AUTH=open in .env.local): every visitor is the admin. Remove the variable to enforce sign-in again.
  if (process.env.ADMIN_AUTH === "open") return { sub: "admin" };
  const session = await verifySession(cookies().get(COOKIE)?.value, process.env.SESSION_SECRET);
  const admin = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  return session && admin && session.sub === admin ? session : null;
}

export const unauthorized = () => Response.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
