import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Every function that touches private data requires APP_SECRET (set in the Convex dashboard and on the Next.js server).
// The browser never talks to Convex: only the site's own server routes do, after their own admin checks.
const guard = (secret: string) => {
  const expected = process.env.APP_SECRET;
  if (!expected || secret.length !== expected.length || secret !== expected) throw new Error("Unauthorized");
};
const COLLS = ["providers", "customers", "requests", "workOrders", "ratings"] as const;

export const getAll = query({
  args: { secret: v.string() },
  handler: async (ctx, { secret }) => {
    guard(secret);
    const out: Record<string, unknown[]> = {};
    for (const c of COLLS) {
      const rows = await ctx.db.query("records").withIndex("by_coll_rid", (q) => q.eq("coll", c)).collect();
      out[c] = rows.sort((a, b) => a.i - b.i).map((r) => r.data);
    }
    const meta = async (key: string) => (await ctx.db.query("meta").withIndex("by_key", (q) => q.eq("key", key)).unique())?.value ?? null;
    return { ...out, settings: await meta("settings"), by: (await meta("by")) ?? "server" };
  },
});

export const applyDiff = mutation({
  args: {
    secret: v.string(),
    by: v.string(),
    settings: v.optional(v.any()),
    upserts: v.array(v.object({ coll: v.string(), rid: v.string(), i: v.number(), data: v.any() })),
    deletes: v.array(v.object({ coll: v.string(), rid: v.string() })),
  },
  handler: async (ctx, { secret, by, settings, upserts, deletes }) => {
    guard(secret);
    const find = (coll: string, rid: string) => ctx.db.query("records").withIndex("by_coll_rid", (q) => q.eq("coll", coll).eq("rid", rid)).unique();
    for (const d of deletes) { const row = await find(d.coll, d.rid); if (row) await ctx.db.delete(row._id); }
    for (const u of upserts) {
      const row = await find(u.coll, u.rid);
      if (row) await ctx.db.patch(row._id, { i: u.i, data: u.data }); else await ctx.db.insert("records", u);
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
