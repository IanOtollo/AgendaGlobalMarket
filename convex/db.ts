import { mutation, query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";

// Every function that touches private data requires APP_SECRET (set in the Convex dashboard and on the Next.js server).
// The browser never talks to Convex: only the site's own server routes do, after their own admin checks.
const guard = (secret: string) => {
  const expected = process.env.APP_SECRET;
  if (!expected || secret.length !== expected.length || secret !== expected) throw new Error("Unauthorized");
};
const COLLS = ["providers", "customers", "requests", "workOrders", "ratings"] as const;
// New records go to the front of these lists (newest first); everywhere else they go to the end.
const PREPEND = new Set(["workOrders", "requests"]);

const rows = (ctx: QueryCtx, coll: string) => ctx.db.query("records").withIndex("by_coll_i", (q) => q.eq("coll", coll)).order("asc").collect();
const meta = async (ctx: QueryCtx, key: string) => (await ctx.db.query("meta").withIndex("by_key", (q) => q.eq("key", key)).unique())?.value ?? null;

/** Everything, for the signed-in admin. */
export const getAll = query({
  args: { secret: v.string() },
  handler: async (ctx, { secret }) => {
    guard(secret);
    const out: Record<string, unknown[]> = {};
    for (const c of COLLS) out[c] = (await rows(ctx, c)).map((r) => r.data);
    return { ...out, settings: await meta(ctx, "settings"), by: (await meta(ctx, "by")) ?? "server" };
  },
});

/** Only what the public website is built from: no customers, no work orders. */
export const getPublic = query({
  args: { secret: v.string() },
  handler: async (ctx, { secret }) => {
    guard(secret);
    return {
      providers: (await rows(ctx, "providers")).map((r) => r.data),
      ratings: (await rows(ctx, "ratings")).map((r) => r.data),
      settings: await meta(ctx, "settings"),
    };
  },
});

/**
 * Saves only the records that changed. There is deliberately no way to delete: workers and records are never
 * removed (staff are marked as resigned or let go), so a stale browser tab can never make a profile disappear.
 */
export const applyChanges = mutation({
  args: {
    secret: v.string(),
    by: v.string(),
    settings: v.optional(v.any()),
    upserts: v.array(v.object({ coll: v.string(), rid: v.string(), data: v.any() })),
  },
  handler: async (ctx, { secret, by, settings, upserts }) => {
    guard(secret);
    const edge = new Map<string, number>();
    for (const u of upserts) {
      if (!(COLLS as readonly string[]).includes(u.coll)) throw new Error("Unknown collection");
      const row = await ctx.db.query("records").withIndex("by_coll_rid", (q) => q.eq("coll", u.coll).eq("rid", u.rid)).unique();
      if (row) { await ctx.db.patch(row._id, { data: u.data }); continue; }
      // A new record: place it at the front or the end of its list.
      if (!edge.has(u.coll)) {
        const last = await ctx.db.query("records").withIndex("by_coll_i", (q) => q.eq("coll", u.coll)).order(PREPEND.has(u.coll) ? "asc" : "desc").first();
        edge.set(u.coll, last ? last.i : PREPEND.has(u.coll) ? 1 : -1);
      }
      const i = edge.get(u.coll)! + (PREPEND.has(u.coll) ? -1 : 1);
      edge.set(u.coll, i);
      await ctx.db.insert("records", { coll: u.coll, rid: u.rid, i, data: u.data });
    }
    const setMeta = async (key: string, value: unknown) => {
      const row = await ctx.db.query("meta").withIndex("by_key", (q) => q.eq("key", key)).unique();
      if (row) await ctx.db.patch(row._id, { value }); else await ctx.db.insert("meta", { key, value });
    };
    if (settings !== undefined) await setMeta("settings", settings);
    await setMeta("by", by);
  },
});

// Photos: the server asks for a one-time upload URL, uploads the file, and stores the returned id on the worker.
export const generateUploadUrl = mutation({
  args: { secret: v.string() },
  handler: async (ctx, { secret }) => { guard(secret); return await ctx.storage.generateUploadUrl(); },
});
export const photoUrl = query({
  args: { id: v.id("_storage") },
  handler: async (ctx, { id }) => ctx.storage.getUrl(id),
});
