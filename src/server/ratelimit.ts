// Small in-memory sliding-window limiter. Good enough for one server process; replace with the BaaS/edge limiter later.
const g = globalThis as unknown as { __hits?: Map<string, number[]> };

export function allow(key: string, limit: number, windowMs: number) {
  const hits = (g.__hits ??= new Map<string, number[]>());
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) { hits.set(key, recent); return false; }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
}

// State-changing requests must come from this site (blocks cross-site form posts and fetches).
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return false;
  try { return new URL(origin).host === host; } catch { return false; }
}
