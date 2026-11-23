import type { MetadataRoute } from "next";
import { AREA_LIST } from "@/lib/areas";
import { CATEGORY_LIST } from "@/lib/categories";
import { distanceKm } from "@/lib/geo";
import { abs } from "@/lib/schema";
import { getPublicPros } from "@/server/public";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pros = await getPublicPros();
  const fixed = ["/", "/services", "/how-it-works", "/trust-and-safety", "/become-a-pro", "/about", "/contact", "/help", "/accessibility",
    "/legal/terms", "/legal/privacy", "/legal/cookies", "/legal/pro-agreement", "/legal/cancellation-refunds", "/legal/acceptable-use"];
  const urls: MetadataRoute.Sitemap = fixed.map((p) => ({ url: abs(p), lastModified: now, changeFrequency: p.startsWith("/legal") ? "yearly" : "monthly", priority: p === "/" ? 1 : 0.6 }));
  for (const c of CATEGORY_LIST) {
    urls.push({ url: abs(`/services/${c.slug}`), lastModified: now, changeFrequency: "daily", priority: 0.9 });
    // Only area pages that have someone nearby (the same rule that decides indexing).
    for (const a of AREA_LIST) {
      if (pros.some((p) => p.category === c.name && distanceKm(a, p) <= 15)) urls.push({ url: abs(`/services/${c.slug}/${a.slug}`), lastModified: now, changeFrequency: "daily", priority: 0.8 });
    }
  }
  for (const p of pros) urls.push({ url: abs(`/pros/${p.slug}`), lastModified: now, changeFrequency: "weekly", priority: 0.7 });
  return urls;
}
