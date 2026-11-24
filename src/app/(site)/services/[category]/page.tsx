import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { serviceDetail } from "@/content/services";
import { Breadcrumbs, Container, Section } from "@/components/ds/primitives";
import { BrowseView } from "@/components/site/browse-view";
import { CategoryRail } from "@/components/site/category-rail";
import { ProCardSkeleton, ProGrid } from "@/components/site/pro-card";
import { tradeBySlug, tradesOf } from "@/lib/trades";
import { getPublicPros, getPublicSettings } from "@/server/public";

export const revalidate = 30; // rebuilt in the background at most this often, so traffic is served from cache
export function generateStaticParams() { return []; } // pages are built on the first visit, then cached and refreshed in the background
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: { category: string } }): Promise<Metadata> {
  const c = tradeBySlug(tradesOf(await getPublicSettings()), params.category);
  if (!c) return {};
  const n = (await getPublicPros()).filter((p) => p.category === c.name).length;
  return {
    title: `${c.name} professionals in Nairobi`,
    description: `${n} ${c.name.toLowerCase()} ${n === 1 ? "professional" : "professionals"} in Nairobi. ${c.blurb} Compare experience and ratings, then book through one office.`,
    alternates: { canonical: `/services/${c.slug}` },
  };
}

export default async function CategoryPage({ params }: { params: { category: string } }) {
  const c = tradeBySlug(tradesOf(await getPublicSettings()), params.category);
  if (!c) notFound();
  const d = serviceDetail(c.name);
  return (
    <>
      <Section className="!pb-8 !pt-8 md:!pt-12">
        <Container>
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Services", href: "/services" }, { label: c.name }]} />
          <div className={d ? "mt-4 grid items-center gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:gap-14" : "mt-4"}>
            <div>
              <h1 className="text-h1">{d?.title ?? `${c.name} professionals`}</h1>
              <p className="mt-3 max-w-[60ch] text-lg text-muted-foreground">{c.blurb}</p>
              {d && (
                <>
                  <h2 className="mt-8 text-h3">Our {c.name.toLowerCase()} solutions</h2>
                  <ul className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                    {d.solutions.map((s) => (
                      <li key={s} className="flex items-start gap-3 text-[16px] leading-snug">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-on-accent"><Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden /></span>
                        {s}
                      </li>
                    ))}
                  </ul>
                  {d.badges && <p className="mt-6 flex flex-wrap gap-2 text-sm font-medium">{d.badges.map((b) => <span key={b} className="rounded-full border border-border px-3 py-1">{b}</span>)}</p>}
                </>
              )}
            </div>
            {d && (
              <div className="relative aspect-[4/5] w-full max-w-sm justify-self-start overflow-hidden rounded-card border border-border bg-muted lg:max-w-none lg:justify-self-end">
                <Image src={d.image} alt={`${d.title}: a One Agenda Global Market professional at work`} fill priority unoptimized sizes="(min-width: 1024px) 380px, 90vw" className="object-cover object-center" />
              </div>
            )}
          </div>
          <div className="mt-10"><CategoryRail selected={c.name} /></div>
        </Container>
      </Section>
      <Section className="!pt-4 md:!pt-8">
        <Container>
          <Suspense fallback={<ProGrid><ProCardSkeleton /><ProCardSkeleton /><ProCardSkeleton /></ProGrid>}><BrowseView category={c.name} /></Suspense>
        </Container>
      </Section>
    </>
  );
}
