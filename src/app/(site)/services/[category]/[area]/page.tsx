import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Accordion, Breadcrumbs, Container, Section } from "@/components/ds/primitives";
import { BrowseView } from "@/components/site/browse-view";
import { ProCard, ProCardSkeleton, ProGrid, kes } from "@/components/site/pro-card";
import { AREA_BY_SLUG, AREA_LIST } from "@/lib/areas";
import { CATEGORY_LIST, TRADE_NOUN, categoryBySlug } from "@/lib/categories";
import { distanceKm } from "@/lib/geo";
import { JsonLd, abs, breadcrumbLd, faqLd } from "@/lib/schema";
import { getPublicPros } from "@/server/public";

export const dynamic = "force-dynamic";

const NEAR_KM = 15;

async function data(categorySlug: string, areaSlug: string) {
  const category = categoryBySlug(categorySlug);
  const area = AREA_BY_SLUG[areaSlug];
  if (!category || !area) return null;
  const pros = (await getPublicPros()).filter((p) => p.category === category.name)
    .map((p) => ({ p, km: distanceKm(area, p) })).sort((a, b) => a.km - b.km || b.p.rating.avg - a.p.rating.avg);
  const near = pros.filter((x) => x.km <= NEAR_KM);
  const prices = near.map((x) => x.p.fromPrice).filter((n): n is number => typeof n === "number");
  const nearbyAreas = AREA_LIST.filter((a) => a.slug !== area.slug).map((a) => ({ a, km: distanceKm(area, a) })).sort((x, y) => x.km - y.km).slice(0, 6).map((x) => x.a);
  return { category, area, pros, near, avg: prices.length ? Math.round(prices.reduce((s, n) => s + n, 0) / prices.length) : null, nearbyAreas };
}

export async function generateMetadata({ params }: { params: { category: string; area: string } }): Promise<Metadata> {
  const d = await data(params.category, params.area);
  if (!d) return {};
  const noun = TRADE_NOUN[d.category.name];
  const n = d.near.length;
  return {
    title: `${noun} in ${d.area.name}, Nairobi`,
    description: n ? `${n} ${d.category.name.toLowerCase()} ${n === 1 ? "professional" : "professionals"} within ${NEAR_KM} km of ${d.area.name}. Compare experience and ratings, then book through one office.` : `${noun} for ${d.area.name}, Nairobi, booked through one office.`,
    alternates: { canonical: `/services/${d.category.slug}/${d.area.slug}` },
    // Thin pages (nobody nearby) stay out of search results.
    robots: n ? undefined : { index: false, follow: true },
  };
}

export default async function AreaLanding({ params }: { params: { category: string; area: string } }) {
  const d = await data(params.category, params.area);
  if (!d) notFound();
  const { category, area, near, avg, nearbyAreas } = d;
  const noun = TRADE_NOUN[category.name];
  const within5 = near.filter((x) => x.km <= 5).length;
  const crumbs = [{ label: "Home", href: "/" }, { label: "Services", href: "/services" }, { label: category.name, href: `/services/${category.slug}` }, { label: area.name }];
  const faq = [
    { q: `How do I book a ${category.name.toLowerCase()} professional in ${area.name}?`, a: `Choose a professional on this page, then message or call the office. We confirm the time and the price with you before work starts.` },
    { q: `How close are the ${noun.toLowerCase()} to ${area.name}?`, a: near.length ? `${near.length} of our ${noun.toLowerCase()} are based within ${NEAR_KM} km of ${area.name}${within5 ? `, and ${within5} within 5 km` : ""}. The nearest are listed first.` : `We have no ${noun.toLowerCase()} based within ${NEAR_KM} km of ${area.name} right now. Message the office and we will arrange one.` },
    { q: "How is the price decided?", a: "The office agrees a price or estimate with you before work starts. If the job needs more work, you are told first and nothing extra goes ahead without your agreement." },
  ];

  return (
    <>
      <JsonLd data={breadcrumbLd(crumbs)} />
      <JsonLd data={faqLd(faq)} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ItemList", name: `${noun} in ${area.name}`, itemListElement: near.slice(0, 6).map((x, i) => ({ "@type": "ListItem", position: i + 1, name: x.p.name, url: abs(`/pros/${x.p.slug}`) })) }} />
      <Section className="!pb-8 !pt-8 md:!pt-12">
        <Container>
          <Breadcrumbs items={crumbs} />
          <h1 className="mt-4 text-h1">{noun} in {area.name}</h1>
          <p className="mt-4 max-w-[60ch] text-lg leading-relaxed text-muted-foreground">
            {near.length ? <>{near.length} {category.name.toLowerCase()} {near.length === 1 ? "professional" : "professionals"} within {NEAR_KM} km of {area.name}{avg != null ? <>, with prices from around {kes(avg)} per visit</> : null}. {category.blurb}</> : <>We have no {noun.toLowerCase()} based close to {area.name} right now. Message the office and we will arrange one.</>}
          </p>
        </Container>
      </Section>

      {near.length > 0 && (
        <Section className="!pt-4 md:!pt-8">
          <Container>
            <h2 className="text-h2">Nearest {noun.toLowerCase()}</h2>
            <ProGrid className="mt-8">{near.slice(0, 6).map((x) => <ProCard key={x.p.ref} pro={x.p} km={x.km} />)}</ProGrid>
          </Container>
        </Section>
      )}

      <Section className="border-t border-border !pt-12 md:!pt-16">
        <Container>
          <h2 className="mb-8 text-h2">Filter all {category.name.toLowerCase()} professionals</h2>
          <Suspense fallback={<ProGrid><ProCardSkeleton /><ProCardSkeleton /><ProCardSkeleton /></ProGrid>}><BrowseView category={category.name} areaLock={area.slug} /></Suspense>
        </Container>
      </Section>

      <Section className="border-t border-border bg-muted">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1fr]">
          <div>
            <h2 className="text-h3">{noun} near {area.name}</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {nearbyAreas.map((a) => <li key={a.slug}><Link href={`/services/${category.slug}/${a.slug}`} className="inline-flex min-h-11 items-center rounded-lg border border-border-strong bg-card px-4 text-[15px] font-medium hover:bg-background">{a.name}</Link></li>)}
            </ul>
            <p className="mt-6 text-[15px] text-muted-foreground">Other trades in {area.name}:</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {CATEGORY_LIST.filter((c) => c.slug !== category.slug).map((c) => <li key={c.slug}><Link href={`/services/${c.slug}/${area.slug}`} className="inline-flex min-h-11 items-center rounded-lg border border-border-strong bg-card px-4 text-[15px] font-medium hover:bg-background">{TRADE_NOUN[c.name]}</Link></li>)}
            </ul>
          </div>
          <div><h2 className="mb-4 text-h3">Questions about {noun.toLowerCase()} in {area.name}</h2><Accordion items={faq} /></div>
        </Container>
      </Section>
    </>
  );
}
