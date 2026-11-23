import fs from "fs";
import path from "path";
import { seed } from "@/lib/seed";
import { BRAND } from "@/lib/config";
import { AREA_BY_NAME } from "@/lib/areas";
import { uniqueSlug } from "@/lib/slug";
import { uid } from "@/lib/utils";
import type { DB } from "@/lib/types";

// Single shared copy of the data, persisted to data/db.json. Only the admin session may read or write it
// directly; the public site is served from the whitelist in src/server/public.ts.
const FILE = path.join(process.cwd(), "data", "db.json");
type Listener = (db: DB, by: string) => void;
const g = globalThis as unknown as { __db?: DB; __subs?: Set<Listener> };

const empty: DB = {
  settings: { businessName: BRAND.name, adminPhone: "" },
  providers: [], customers: [], requests: [], workOrders: [], ratings: [],
};
// Demo data only in development (or when explicitly enabled). A production install starts empty.
const useSeed = () => process.env.NODE_ENV !== "production" || process.env.SEED_DEMO === "1";

// Keeps derived/public fields consistent: unique slugs, and base-area coordinates from data/areas.json.
export function normalize(db: DB): DB {
  const taken = new Set<string>();
  db.providers = db.providers.map((p) => {
    const area = AREA_BY_NAME[p.area];
    return { ...p, slug: uniqueSlug(p.slug || p.name, taken), ...(area ? { lat: area.lat, lng: area.lng } : {}) };
  });
  return db;
}

function load(): DB {
  const base = useSeed() ? seed : empty;
  try {
    return normalize({ ...base, ...JSON.parse(fs.readFileSync(FILE, "utf8")) });
  } catch {
    return normalize(structuredClone(base));
  }
}

export const getDb = (): DB => (g.__db ??= load());
export const subscribers = (): Set<Listener> => (g.__subs ??= new Set());

export function setDb(input: DB, by: string) {
  const db = normalize(input);
  g.__db = db;
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(db));
  } catch {}
  subscribers().forEach((fn) => fn(db, by));
}

// Public rating submission: the only way a visitor can change data, and only to add one rating to a completed job.
export function addRatingToJob(workOrderId: string, stars: number, comment: string): "ok" | "unavailable" | "already_rated" {
  const db = getDb();
  const wo = db.workOrders.find((w) => w.id === workOrderId);
  if (!wo || wo.status !== "completed" || !wo.providerId) return "unavailable";
  if (db.ratings.some((r) => r.workOrderId === workOrderId)) return "already_rated";
  setDb({ ...db, ratings: [...db.ratings, { id: uid("rt"), workOrderId, providerId: wo.providerId, stars, comment, createdAt: new Date().toISOString() }] }, "public-rating");
  return "ok";
}
