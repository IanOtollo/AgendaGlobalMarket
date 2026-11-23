import { getDb, subscribers } from "@/server/db";
import { getAdmin, unauthorized } from "@/server/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Live updates for the admin only (Server-Sent Events).
export async function GET(req: Request) {
  if (!(await getAdmin())) return unauthorized();
  const enc = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream({
    start(controller) {
      const send = (db: unknown, by: string) => controller.enqueue(enc.encode(`data: ${JSON.stringify({ db, by })}\n\n`));
      send(getDb(), "server");
      subscribers().add(send);
      const ping = setInterval(() => controller.enqueue(enc.encode(": ping\n\n")), 25000);
      cleanup = () => {
        clearInterval(ping);
        subscribers().delete(send);
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
