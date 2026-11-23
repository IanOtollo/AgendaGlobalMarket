import type { Metadata } from "next";
import { Accordion, Container, Section } from "@/components/ds/primitives";
import { ContactCta, PageHero } from "@/components/site/page-parts";
import { FAQ_HELP } from "@/lib/faq";
import { JsonLd, faqLd } from "@/lib/schema";
import { getPublicSettings } from "@/server/public";

export const metadata: Metadata = { title: "Help centre", description: "Answers about booking, prices, cancellations, ratings, your location and joining as a professional.", alternates: { canonical: "/help" } };
export const revalidate = 30; // rebuilt in the background at most this often, so traffic is served from cache

export default async function Page() {
  const { adminPhone } = await getPublicSettings();
  const all = FAQ_HELP.flatMap((g) => g.items);
  return (
    <>
      <JsonLd data={faqLd(all)} />
      <PageHero crumbs={[{ label: "Help centre" }]} title="How can we help?" lead="Quick answers. If yours is not here, message the office." />
      <Section>
        <Container className="max-w-3xl space-y-14">
          {FAQ_HELP.map((g) => (
            <section key={g.title} aria-labelledby={`g-${g.title}`}>
              <h2 id={`g-${g.title}`} className="mb-4 text-h3">{g.title}</h2>
              <Accordion items={g.items.map((i) => ({ q: i.q, a: i.a }))} />
            </section>
          ))}
        </Container>
      </Section>
      <ContactCta phone={adminPhone} title="Still need help?" message="Hi, I have a question." />
    </>
  );
}
