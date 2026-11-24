import fs from "fs";
import path from "path";
import { ConvexClient, ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import { BRAND } from "@/lib/config";
import { AREA_BY_NAME, registerAreas } from "@/lib/areas";
import { uniqueSlug } from "@/lib/slug";
import { uid } from "@/lib/utils";
import type { DB } from "@/lib/types";

// The one shared copy of the data. Backed by Convex when CONVEX_URL and APP_SECRET are set, otherwise by data/db.json
// (local development). Only the admin session may read or write it directly; the public site is served from the
// whitelist in src/server/public.ts and never touches customers or work orders.
const FILE = path.join(process.cwd(), "data", "db.json");
type Listener = (db: DB, by: string) => void;
export type PublicSource = Pick<DB, "providers" | "ratings" | "settings">;
export const COLLS = ["providers", "customers", "requests", "workOrders", "ratings"] as const;
export type Coll = (typeof COLLS)[number];
export type Changes = { upserts: { coll: Coll; rid: string; data: Record<string, unknown> }[]; settings?: DB["settings"] };
type G = {
  __ver?: number; __db?: DB; __at?: number; __subs?: Set<Listener>; __live?: ConvexClient; __unsub?: () => void; __http?: ConvexHttpClient;
  __pub?: PublicSource; __pubAt?: number; __inflight?: Promise<DB>;
};
const g = globalThis as unknown as G;

const empty: DB = {
  settings: { businessName: BRAND.name, adminPhone: "" },
  providers: [], customers: [], requests: [], workOrders: [], ratings: [],
};
// There is no demo data: a new install starts empty and everything comes from the admin.

export const convexConfigured = () => Boolean(process.env.CONVEX_URL && process.env.APP_SECRET);
const secret = () => process.env.APP_SECRET as string;
// Next.js caches server-side fetches by default, which would freeze the first answer Convex gave (even an empty one
// from build time). Never cache these.
const noCacheFetch: typeof fetch = (input, init) => fetch(input, { ...init, cache: "no-store" });
export const convexHttp = () => (g.__http ??= new ConvexHttpClient(process.env.CONVEX_URL as string, { fetch: noCacheFetch }));
const PUBLIC_TTL_MS = 30_000;
const building = () => process.env.NEXT_PHASE === "phase-production-build";

// Keeps derived/public fields consistent: unique slugs, and base-area coordinates from data/areas.json.
export function normalize<T extends PublicSource>(db: T): T {
  registerAreas(db.settings?.extraAreas);
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
  try { return normalize({ ...empty, ...JSON.parse(fs.readFileSync(FILE, "utf8")) }); } catch { return normalize(structuredClone(empty)); }
}
const PREPEND: Coll[] = ["workOrders", "requests"];

// ---------- Convex backend ----------
type Remote = Partial<Record<Coll, unknown[]>> & { settings: DB["settings"] | null; by?: string };
const fromRemote = (r: Remote): DB => normalize({
  settings: r.settings ?? empty.settings,
  providers: (r.providers ?? []) as DB["providers"], customers: (r.customers ?? []) as DB["customers"],
  requests: (r.requests ?? []) as DB["requests"], workOrders: (r.workOrders ?? []) as DB["workOrders"], ratings: (r.ratings ?? []) as DB["ratings"],
});

async function fetchRemote(): Promise<DB> {
  const r = (await convexHttp().query(anyApi.db.getAll, { secret: secret() })) as Remote;
  if (r.settings) return fromRemote(r);
  // First run against an empty Convex deployment: initialise it with empty collections.
  await convexHttp().mutation(anyApi.db.applyChanges, { secret: secret(), by: "server", settings: empty.settings, upserts: [] });
  return normalize(structuredClone(empty));
}

/** Everything, for the admin. Falls back to the last good copy if the database is briefly unreachable. */
export async function getDb(): Promise<DB> {
  if (!convexConfigured()) return (g.__db ??= loadFile());
  // Always read from Convex (it is the only source of truth). Nothing is reused between requests, because on serverless
  // hosting every instance would keep its own copy and they would disagree. Only a read that is already in flight is
  // shared, so one page render makes one query.
  if (g.__inflight) return g.__inflight;
  g.__inflight = readRemote().finally(() => { g.__inflight = undefined; });
  return g.__inflight;
}

async function readRemote(): Promise<DB> {
  // A write that lands while this read is in flight must not be overwritten by the older data we just fetched.
  const ver = g.__ver ?? 0;
  try {
    const fresh = await fetchRemote();
    if ((g.__ver ?? 0) === ver) { g.__db = fresh; g.__at = Date.now(); return fresh; }
    return g.__db ?? fresh;
  } catch (e) {
    if (g.__db) return g.__db;
    throw e;
  }
}

/**
 * The data the public website is built from: providers, ratings and settings only, cached for 30 seconds per server
 * instance, and served stale if the database is briefly unreachable, so visitor traffic never depends on it directly.
 */
export async function getPublicDb(): Promise<PublicSource> {
  if (!convexConfigured()) return getDb();
  if (g.__pub && Date.now() - (g.__pubAt ?? 0) < PUBLIC_TTL_MS) return g.__pub;
  try {
    const r = (await convexHttp().query(anyApi.db.getPublic, { secret: secret() })) as { providers: unknown[]; ratings: unknown[]; settings: DB["settings"] | null };
    if (!r.settings) { const all = await getDb(); g.__pub = { providers: all.providers, ratings: all.ratings, settings: all.settings }; }
    else g.__pub = normalize({ providers: r.providers as DB["providers"], ratings: r.ratings as DB["ratings"], settings: r.settings });
    g.__pubAt = Date.now();
    return g.__pub;
  } catch (e) {
    if (g.__pub) return g.__pub;
    // Building the site while the database is unreachable: build with an empty list, and refresh on the first real visit.
    if (building()) return { providers: [], ratings: [], settings: empty.settings };
    throw e;
  }
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
      g.__pub = { providers: db.providers, ratings: db.ratings, settings: db.settings }; g.__pubAt = Date.now();
      subscribers().forEach((l) => l(db, r.by ?? "server"));
    }, () => { /* dropped connection: the client reconnects by itself */ });
  }
  return () => {
    subscribers().delete(fn);
    if (!subscribers().size && g.__live) { g.__unsub?.(); void g.__live.close(); g.__live = undefined; g.__unsub = undefined; }
  };
}

/**
 * Saves only the records that changed (never a whole copy, and never a delete), so an out-of-date browser tab cannot
 * overwrite someone else's newer work or remove a profile.
 */
export async function applyChanges(c: Changes, by: string) {
  if (convexConfigured()) {
    g.__ver = (g.__ver ?? 0) + 1;
    await convexHttp().mutation(anyApi.db.applyChanges, { secret: secret(), by, settings: c.settings, upserts: c.upserts });
    g.__ver = (g.__ver ?? 0) + 1;
    g.__pubAt = 0;
    g.__at = 0;
    const fresh = await getDb();
    subscribers().forEach((fn) => fn(fresh, by));
    return;
  }
  const db = await getDb();
  for (const u of c.upserts) {
    const list = db[u.coll] as { id: string }[];
    const at = list.findIndex((x) => x.id === u.rid);
    if (at >= 0) list[at] = u.data as { id: string };
    else if (PREPEND.includes(u.coll)) list.unshift(u.data as { id: string });
    else list.push(u.data as { id: string });
  }
  if (c.settings) db.settings = c.settings;
  normalize(db);
  try { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(db)); } catch {}
  subscribers().forEach((fn) => fn(db, by));
}

// Public rating submission: the only way a visitor can change data, and only to add one rating to a completed job.
export async function addRatingToJob(workOrderId: string, stars: number, comment: string): Promise<"ok" | "unavailable" | "already_rated"> {
  const db = await getDb();
  const wo = db.workOrders.find((w) => w.id === workOrderId);
  if (!wo || wo.status !== "completed" || !wo.providerId) return "unavailable";
  if (db.ratings.some((r) => r.workOrderId === workOrderId)) return "already_rated";
  const rating = { id: uid("rt"), workOrderId, providerId: wo.providerId, stars, comment, createdAt: new Date().toISOString() };
  await applyChanges({ upserts: [{ coll: "ratings", rid: rating.id, data: rating }] }, "public-rating");
  return "ok";
}
