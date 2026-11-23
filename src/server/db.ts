import fs from "fs";
import path from "path";
import { ConvexClient, ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import { seed } from "@/lib/seed";
import { BRAND } from "@/lib/config";
import { AREA_BY_NAME } from "@/lib/areas";
import { uniqueSlug } from "@/lib/slug";
import { uid } from "@/lib/utils";
import type { DB } from "@/lib/types";

// The one shared copy of the data. Backed by Convex when CONVEX_URL and APP_SECRET are set, otherwise by data/db.json
// (local development). Only the admin session may read or write it directly; the public site is served from the
// whitelist in src/server/public.ts.
const FILE = path.join(process.cwd(), "data", "db.json");
type Listener = (db: DB, by: string) => void;
type G = { __db?: DB; __at?: number; __by?: string; __subs?: Set<Listener>; __live?: ConvexClient; __unsub?: () => void; __http?: ConvexHttpClient };
const g = globalThis as unknown as G;

const COLLS = ["providers", "customers", "requests", "workOrders", "ratings"] as const;
const empty: DB = {
  settings: { businessName: BRAND.name, adminPhone: "" },
  providers: [], customers: [], requests: [], workOrders: [], ratings: [],
};
// Demo data only in development (or when explicitly enabled). A production install starts empty.
const useSeed = () => process.env.NODE_ENV !== "production" || process.env.SEED_DEMO === "1";

export const convexConfigured = () => Boolean(process.env.CONVEX_URL && process.env.APP_SECRET);
const secret = () => process.env.APP_SECRET as string;
export const convexHttp = () => (g.__http ??= new ConvexHttpClient(process.env.CONVEX_URL as string));

// Keeps derived/public fields consistent: unique slugs, and base-area coordinates from data/areas.json.
export function normalize(db: DB): DB {
  const taken = new Set<string>();
  db.providers = db.providers.map((p) => {
    const area = AREA_BY_NAME[p.area];
    return { ...p, slug: uniqueSlug(p.slug || p.name, taken), ...(area ? { lat: area.lat, lng: area.lng } : {}) };
  });
  return db;
}

export const subscribers = (): Set<Listener> => (g.__subs ??= new Set());

// ---------- file backend (local development) ----------
function loadFile(): DB {
  const base = useSeed() ? seed : empty;
  try { return normalize({ ...base, ...JSON.parse(fs.readFileSync(FILE, "utf8")) }); } catch { return normalize(structuredClone(base)); }
}

// ---------- Convex backend ----------
type Remote = Partial<Record<(typeof COLLS)[number], unknown[]>> & { settings: DB["settings"] | null; by?: string };
const fromRemote = (r: Remote): DB => normalize({
  settings: r.settings ?? empty.settings,
  providers: (r.providers ?? []) as DB["providers"], customers: (r.customers ?? []) as DB["customers"],
  requests: (r.requests ?? []) as DB["requests"], workOrders: (r.workOrders ?? []) as DB["workOrders"], ratings: (r.ratings ?? []) as DB["ratings"],
});

const stable = (v: unknown): string => JSON.stringify(v, (_k, x) => (x && typeof x === "object" && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => a.localeCompare(b))) : x));

async function writeRemote(next: DB, prev: DB | null, by: string) {
  const upserts: { coll: string; rid: string; i: number; data: unknown }[] = [];
  const deletes: { coll: string; rid: string }[] = [];
  for (const c of COLLS) {
    const before = new Map((prev?.[c] ?? []).map((r, i) => [r.id, { i, s: stable(r) }]));
    const after = next[c] as { id: string }[];
    after.forEach((r, i) => {
      const old = before.get(r.id);
      if (!old || old.i !== i || old.s !== stable(r)) upserts.push({ coll: c, rid: r.id, i, data: JSON.parse(JSON.stringify(r)) });
      before.delete(r.id);
    });
    before.forEach((_v, rid) => deletes.push({ coll: c, rid }));
  }
  const settings = !prev || stable(prev.settings) !== stable(next.settings) ? JSON.parse(JSON.stringify(next.settings)) : undefined;
  if (!upserts.length && !deletes.length && settings === undefined) return;
  await convexHttp().mutation(anyApi.db.applyDiff, { secret: secret(), by, settings, upserts, deletes });
}

async function fetchRemote(): Promise<DB> {
  const r = (await convexHttp().query(anyApi.db.getAll, { secret: secret() })) as Remote;
  if (r.settings) { g.__by = r.by; return fromRemote(r); }
  // First run against an empty Convex deployment: seed it.
  const base = normalize(structuredClone(useSeed() ? seed : empty));
  await writeRemote(base, null, "server");
  return base;
}

export async function getDb(): Promise<DB> {
  if (!convexConfigured()) return (g.__db ??= loadFile());
  // Fresh while a live subscription is open, otherwise reused for a moment so one page render makes one query.
  if (g.__db && (g.__live || Date.now() - (g.__at ?? 0) < 1500)) return g.__db;
  g.__db = await fetchRemote();
  g.__at = Date.now();
  return g.__db;
}

/** Calls the listener on every data change, from this server or (with Convex) from any other. Returns an unsubscribe function. */
export function subscribe(fn: Listener): () => void {
  subscribers().add(fn);
  if (convexConfigured() && !g.__live) {
    const client = new ConvexClient(process.env.CONVEX_URL as string);
    g.__live = client;
    g.__unsub = client.onUpdate(anyApi.db.getAll, { secret: secret() }, (r: Remote) => {
      if (!r.settings) return;
      const db = fromRemote(r);
      g.__db = db; g.__at = Date.now();
      subscribers().forEach((l) => l(db, r.by ?? "server"));
    }, () => { /* dropped connection: the client reconnects by itself */ });
  }
  return () => {
    subscribers().delete(fn);
    if (!subscribers().size && g.__live) { g.__unsub?.(); void g.__live.close(); g.__live = undefined; g.__unsub = undefined; }
  };
}

export async function setDb(input: DB, by: string) {
  const db = normalize(input);
  if (convexConfigured()) {
    const prev = await getDb();
    await writeRemote(db, prev, by);
    g.__db = db; g.__at = Date.now();
  } else {
    g.__db = db;
    try { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(db)); } catch {}
  }
  subscribers().forEach((fn) => fn(db, by));
}

// Public rating submission: the only way a visitor can change data, and only to add one rating to a completed job.
export async function addRatingToJob(workOrderId: string, stars: number, comment: string): Promise<"ok" | "unavailable" | "already_rated"> {
  const db = await getDb();
  const wo = db.workOrders.find((w) => w.id === workOrderId);
  if (!wo || wo.status !== "completed" || !wo.providerId) return "unavailable";
  if (db.ratings.some((r) => r.workOrderId === workOrderId)) return "already_rated";
  await setDb({ ...db, ratings: [...db.ratings, { id: uid("rt"), workOrderId, providerId: wo.providerId, stars, comment, createdAt: new Date().toISOString() }] }, "public-rating");
  return "ok";
}
