import { Suspense } from "react";
import type { Metadata } from "next";
import { Accordion, Container, Section } from "@/components/ds/primitives";
import { BecomeProBand, FinalCta, HomeHero, HomeResults, SocialProof, TrustBand } from "@/components/site/home";
import { HowItWorks } from "@/components/site/how-it-works";
import { ProCardSkeleton, ProGrid } from "@/components/site/pro-card";
import { JsonLd, faqLd, organizationLd, websiteLd } from "@/lib/schema";
import { FAQ_HOME } from "@/lib/faq";
import { getPublicSettings } from "@/server/public";

export const revalidate = 30; // rebuilt in the background at most this often, so traffic is served from cache
export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function HomePage() {
  const { adminPhone } = await getPublicSettings();
  return (
    <>
      <JsonLd data={organizationLd(adminPhone)} />
      <JsonLd data={websiteLd()} />
      <JsonLd data={faqLd(FAQ_HOME)} />
      <HomeHero />
      <Suspense fallback={<Container className="py-8"><ProGrid><ProCardSkeleton /><ProCardSkeleton /><ProCardSkeleton /><ProCardSkeleton /></ProGrid></Container>}>
        <HomeResults />
      </Suspense>

      <Section className="border-t border-border" aria-labelledby="how-h">
        <Container>
          <h2 id="how-h" className="text-h2">How it works</h2>
          <HowItWorks phone={adminPhone} />
        </Container>
      </Section>

      <TrustBand />
      <SocialProof />
      <BecomeProBand />

      <Section aria-labelledby="faq-h">
        <Container className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div><h2 id="faq-h" className="text-h2">Questions, answered</h2><p className="mt-3 text-base text-muted-foreground">Still unsure? Message the office and we will help.</p></div>
          <Accordion items={FAQ_HOME.map((f) => ({ q: f.q, a: f.a }))} />
        </Container>
      </Section>

      <FinalCta />
    </>
  );
}
