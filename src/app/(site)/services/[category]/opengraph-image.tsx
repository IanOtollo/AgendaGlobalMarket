import { ogCard } from "@/components/site/og-card";
import { tradeBySlug, tradesOf } from "@/lib/trades";
import { getPublicPros, getPublicSettings } from "@/server/public";

export const alt = "Professionals by trade";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";
export const revalidate = 300; // rebuilt in the background at most this often, so traffic is served from cache

export default async function Image({ params }: { params: { category: string } }) {
  const c = tradeBySlug(tradesOf(await getPublicSettings()), params.category);
  if (!c) return ogCard({ eyebrow: "Services", title: "Agenda Global Market" });
  const n = (await getPublicPros()).filter((p) => p.category === c.name).length;
  return ogCard({ eyebrow: "Nairobi", title: `${c.noun} you can book through one office`, lines: [`${n} ${n === 1 ? "professional" : "professionals"} listed`] });
}
