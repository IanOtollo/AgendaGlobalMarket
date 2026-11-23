import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// One generic table for the five record collections (each record keeps its original JSON shape in `data`,
// `i` preserves list order) and a tiny key/value table for settings and the last editor.
export default defineSchema({
  records: defineTable({ coll: v.string(), rid: v.string(), i: v.number(), data: v.any() })
    .index("by_coll_rid", ["coll", "rid"])
    .index("by_coll_i", ["coll", "i"]),
  meta: defineTable({ key: v.string(), value: v.any() }).index("by_key", ["key"]),
});
