import { ogCard } from "@/components/site/og-card";
import { AREA_BY_SLUG } from "@/lib/areas";
import { TRADE_NOUN, categoryBySlug } from "@/lib/categories";
import { distanceKm } from "@/lib/geo";
import { getPublicPros } from "@/server/public";

export const alt = "Professionals by trade and area";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Image({ params }: { params: { category: string; area: string } }) {
  const c = categoryBySlug(params.category);
  const a = AREA_BY_SLUG[params.area];
  if (!c || !a) return ogCard({ eyebrow: "Services", title: "Agenda Global Market" });
  const n = (await getPublicPros()).filter((p) => p.category === c.name && distanceKm(a, p) <= 15).length;
  return ogCard({ eyebrow: "Nairobi", title: `${TRADE_NOUN[c.name]} in ${a.name}`, lines: [n ? `${n} ${n === 1 ? "professional" : "professionals"} within 15 km` : "Message the office and we will arrange one"] });
}
