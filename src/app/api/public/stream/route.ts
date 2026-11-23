import { getDb, subscribe } from "@/server/db";
import { publicProsOf, publicSettingsOf } from "@/server/public";
import { allow, clientIp } from "@/server/ratelimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Live updates for the public website. Carries ONLY the public read model (see src/server/public.ts),
// so visitors see new professionals, ratings and contact changes instantly without ever receiving private data.
export async function GET(req: Request) {
  if (!allow(`pub-stream:${clientIp(req)}`, 30, 10 * 60_000)) return new Response("Too many requests", { status: 429 });
  const enc = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream({
    async start(controller) {
      const send = (db: Awaited<ReturnType<typeof getDb>>) => {
        try { controller.enqueue(enc.encode(`data: ${JSON.stringify({ pros: publicProsOf(db), settings: publicSettingsOf(db) })}\n\n`)); } catch {}
      };
      const unsubscribe = subscribe((db) => send(db));
      send(await getDb());
      const ping = setInterval(() => { try { controller.enqueue(enc.encode(": ping\n\n")); } catch {} }, 25000);
      cleanup = () => {
        clearInterval(ping);
        unsubscribe();
        try { controller.close(); } catch {}
      };
      req.signal.addEventListener("abort", cleanup);
    },
    cancel() { cleanup(); },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" },
  });
}
