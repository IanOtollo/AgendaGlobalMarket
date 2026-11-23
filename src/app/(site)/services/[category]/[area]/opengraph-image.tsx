import { ogCard } from "@/components/site/og-card";
import { AREA_BY_SLUG } from "@/lib/areas";
import { tradeBySlug, tradesOf } from "@/lib/trades";
import { distanceKm } from "@/lib/geo";
import { getPublicPros, getPublicSettings } from "@/server/public";

export const alt = "Professionals by trade and area";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";
export const revalidate = 300; // rebuilt in the background at most this often, so traffic is served from cache

export default async function Image({ params }: { params: { category: string; area: string } }) {
  const c = tradeBySlug(tradesOf(await getPublicSettings()), params.category);
  const a = AREA_BY_SLUG[params.area];
  if (!c || !a) return ogCard({ eyebrow: "Services", title: "Agenda Global Market" });
  const n = (await getPublicPros()).filter((p) => p.category === c.name && distanceKm(a, p) <= 15).length;
  return ogCard({ eyebrow: "Nairobi", title: `${c.noun} in ${a.name}`, lines: [n ? `${n} ${n === 1 ? "professional" : "professionals"} within 15 km` : "Message the office and we will arrange one"] });
}
