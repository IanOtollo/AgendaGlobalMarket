import type { Metadata } from "next";
import { Container, Section } from "@/components/ds/primitives";
import { ContactCta, PageHero, Prose } from "@/components/site/page-parts";
import { BRAND } from "@/lib/config";
import { SITE } from "@/lib/site";
import { getPublicSettings } from "@/server/public";

export const metadata: Metadata = { title: "About us", description: `${BRAND.name} provides house and building maintenance in Nairobi, booked through one office.`, alternates: { canonical: "/about" } };
export const dynamic = "force-dynamic";

export default function Page() {
  const { adminPhone } = getPublicSettings();
  const l = SITE.legal;
  return (
    <>
      <PageHero crumbs={[{ label: "About us" }]} title={BRAND.tagline} lead={`${BRAND.name} provides house and building maintenance for homes, offices and commercial property.`} />
      <Section>
        <Container>
          <Prose>
            <p>We bring five trades together under one office: plumbing, carpentry, masonry, electrical work and painting. Customers choose a trade, message or call us, and we arrange a qualified professional.</p>
            <h2>How we work</h2>
            <ul>
              <li>One office takes every booking and confirms the time and price with you.</li>
              <li>Each professional is listed with their qualifications, experience and ratings.</li>
              <li>Jobs are scheduled so professionals are never double-booked.</li>
            </ul>
            {(l.entity || l.registrationNo || l.address) && (
              <>
                <h2>Company details</h2>
                <p>{[l.entity, l.registrationNo && `Registration no. ${l.registrationNo}`, l.address].filter(Boolean).join(" · ")}</p>
              </>
            )}
          </Prose>
        </Container>
      </Section>
      <ContactCta phone={adminPhone} title="Talk to the office" message="Hi, I'd like to know more about your services." />
    </>
  );
}
