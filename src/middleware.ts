import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, verifySession } from "@/lib/session";

// First gate: the admin area and the private data API need a valid signed session. (Route handlers and the
// admin layout check again, so a routing mistake here still fails closed.)
export async function middleware(req: NextRequest) {
  if (process.env.ADMIN_AUTH === "open") return NextResponse.next();
  const session = await verifySession(req.cookies.get(COOKIE)?.value, process.env.SESSION_SECRET);
  if (session) return NextResponse.next();

  const { pathname, search } = req.nextUrl;
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/admin/:path*", "/api/db", "/api/db/:path*"] };
