import { Suspense } from "react";
import type { Metadata } from "next";
import { Breadcrumbs, Container, Section } from "@/components/ds/primitives";
import { BrowseView } from "@/components/site/browse-view";
import { CategoryRail } from "@/components/site/category-rail";
import { ProCardSkeleton, ProGrid } from "@/components/site/pro-card";
import { getPublicPros } from "@/server/public";

export const metadata: Metadata = {
  title: "All services",
  description: "Browse plumbers, carpenters, masons, electricians and painters in Nairobi. Compare experience, qualifications and ratings, then book through one office.",
  alternates: { canonical: "/services" },
};
export const revalidate = 30; // rebuilt in the background at most this often, so traffic is served from cache

export default async function ServicesPage() {
  const total = (await getPublicPros()).length;
  return (
    <>
      <Section className="!pb-8 !pt-8 md:!pt-12">
        <Container>
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Services" }]} />
          <h1 className="mt-4 text-h1">All services</h1>
          <p className="mt-3 max-w-[60ch] text-lg text-muted-foreground">{total} {total === 1 ? "professional" : "professionals"} across five trades. Pick a trade, or search by name or area.</p>
          <div className="mt-8"><CategoryRail /></div>
        </Container>
      </Section>
      <Section className="!pt-4 md:!pt-8">
        <Container>
          <Suspense fallback={<ProGrid><ProCardSkeleton /><ProCardSkeleton /><ProCardSkeleton /></ProGrid>}><BrowseView /></Suspense>
        </Container>
      </Section>
    </>
  );
}
