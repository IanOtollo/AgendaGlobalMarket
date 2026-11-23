import { Suspense } from "react";
import type { Metadata } from "next";
import { Accordion, Container, Section } from "@/components/ds/primitives";
import { BecomeProBand, FinalCta, HomeHero, HomeResults, SocialProof, TrustBand } from "@/components/site/home";
import { ProCardSkeleton, ProGrid } from "@/components/site/pro-card";
import { JsonLd, faqLd, organizationLd, websiteLd } from "@/lib/schema";
import { FAQ_HOME } from "@/lib/faq";
import { getPublicSettings } from "@/server/public";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { alternates: { canonical: "/" } };

const STEPS = [
  { n: "1", t: "Choose a trade", d: "Compare pros by experience, ratings and area." },
  { n: "2", t: "Message the office", d: "WhatsApp or call. One number for every booking." },
  { n: "3", t: "We confirm the details", d: "Time and price are agreed before work starts." },
];

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
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-inverse text-base font-semibold text-inverse-foreground" aria-hidden>{s.n}</span>
                <div><h3 className="text-lg font-semibold">{s.t}</h3><p className="mt-1.5 text-base leading-relaxed text-muted-foreground">{s.d}</p></div>
              </li>
            ))}
          </ol>
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
