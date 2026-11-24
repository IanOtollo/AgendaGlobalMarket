import type { Metadata } from "next";
import { Container, Section } from "@/components/ds/primitives";
import { ContactCta, PageHero, Prose } from "@/components/site/page-parts";
import { BRAND } from "@/lib/config";
import { SITE } from "@/lib/site";
import { getPublicSettings } from "@/server/public";

export const metadata: Metadata = { title: "About us", description: `${BRAND.name} provides home, office and building care in Nairobi, booked through one office.`, alternates: { canonical: "/about" } };
export const revalidate = 30; // rebuilt in the background at most this often, so traffic is served from cache

export default async function Page() {
  const { adminPhone } = await getPublicSettings();
  const l = SITE.legal;
  return (
    <>
      <PageHero crumbs={[{ label: "About us" }]} title={BRAND.tagline} lead="Premium home, office and building care services. Your property deserves the best. We deliver excellence!" />
      <Section>
        <Container>
          <Prose>
            <p>Whether you live in a private residence, diplomatic home or apartment, manage an office or operate a commercial facility, maintaining a clean, safe and comfortable environment should never be a struggle.</p>
            <p>At {BRAND.name}, we bring together skilled professionals, specialised equipment and dependable service to take care of your property, from routine maintenance to specialised cleaning and pest management.</p>
            <h2>Our services</h2>
            <h3>Home and building maintenance</h3>
            <ul>
              <li>Plumbing and sanitary installations</li>
              <li>Electrical works and repairs</li>
              <li>Carpentry and joinery</li>
              <li>Masonry and tiling</li>
              <li>Professional painting and decoration</li>
              <li>Gardening, landscaping and lawn care</li>
              <li>Solar water heating systems</li>
            </ul>
            <h3>Laundry and specialised cleaning</h3>
            <ul>
              <li>Household and commercial laundry</li>
              <li>Carpet cleaning</li>
              <li>Curtain cleaning</li>
              <li>Duvets, beddings and general linen</li>
              <li>Deep upholstery cleaning for sofas, couches, dining chairs and office seats</li>
              <li>Stain and odour removal</li>
            </ul>
            <h3>Pest control and fumigation</h3>
            <ul>
              <li>Professional bedbug inspection and eradication</li>
              <li>General pest control</li>
              <li>Cockroach and rodent management</li>
              <li>Termite treatment</li>
              <li>Residential and commercial fumigation</li>
            </ul>
            <h2>Who we serve</h2>
            <p>We proudly extend our services to:</p>
            <ul>
              <li>Diplomatic missions and embassy personnel</li>
              <li>Expatriates and international residents</li>
              <li>Local and international organisations</li>
              <li>Private homeowners and landlords</li>
              <li>Residential estates and apartment complexes</li>
              <li>Hotels, offices and commercial establishments</li>
            </ul>
            <h2>Why {BRAND.name}?</h2>
            <p>We understand that your property is more than just a building. It is your home, workplace and investment.</p>
            <p>That&apos;s why we place a premium on professionalism, reliability, quality workmanship, attention to detail and customer satisfaction.</p>
            <p>Our commitment is simple: the right people, the right expertise and the right solutions, delivered when you need them.</p>
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
