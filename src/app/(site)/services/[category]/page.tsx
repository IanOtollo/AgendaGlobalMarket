import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
  return (
    <>
      <Section className="!pb-8 !pt-8 md:!pt-12">
        <Container>
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Services", href: "/services" }, { label: c.name }]} />
          <h1 className="mt-4 text-h1">{c.name} professionals</h1>
          <p className="mt-3 max-w-[60ch] text-lg text-muted-foreground">{c.blurb}</p>
          <div className="mt-8"><CategoryRail selected={c.name} /></div>
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
