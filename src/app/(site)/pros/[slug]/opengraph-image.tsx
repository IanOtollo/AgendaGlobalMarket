import { ogCard } from "@/components/site/og-card";
import { getPublicPros } from "@/server/public";

export const alt = "Professional profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Image({ params }: { params: { slug: string } }) {
  const p = (await getPublicPros()).find((x) => x.slug === params.slug);
  if (!p) return ogCard({ eyebrow: "Professional", title: "Agenda Global Market" });
  return ogCard({
    eyebrow: `${p.category} · ${p.area}, Nairobi`, title: p.name,
    lines: [`${p.years} ${p.years === 1 ? "year" : "years"} experience`, ...(p.rating.count ? [`Rated ${p.rating.avg.toFixed(1)} out of 5 (${p.rating.count})`] : []), ...(p.fromPrice != null ? [`From KES ${p.fromPrice.toLocaleString("en-KE")} per visit`] : [])],
  });
}
