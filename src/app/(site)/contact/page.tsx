import type { Metadata } from "next";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { Container, Section } from "@/components/ds/primitives";
import { ButtonLink } from "@/components/ds/button";
import { PageHero } from "@/components/site/page-parts";
import { BRAND } from "@/lib/config";
import { SITE } from "@/lib/site";
import { waUrl } from "@/lib/contact";
import { getPublicSettings } from "@/server/public";

export const metadata: Metadata = { title: "Contact us", description: "Call or WhatsApp the office to book a professional, ask a question or report a problem.", alternates: { canonical: "/contact" } };
export const revalidate = 30; // rebuilt in the background at most this often, so traffic is served from cache

const REASONS = [
  ["Book a professional", "Hi, I'd like to book a professional."],
  ["Ask a question", "Hi, I have a question."],
  ["Report a problem with a job", "Hi, I need to report a problem with a recent job."],
  ["Apply as a pro", "Hi, I'd like to apply as a pro."],
];

export default async function Page() {
  const { adminPhone } = await getPublicSettings();
  return (
    <>
      <PageHero crumbs={[{ label: "Contact us" }]} title="Talk to the office" lead="Call or WhatsApp the same number for everything." />
      <Section>
        <Container className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-h3">Message us about</h2>
            {adminPhone ? (
              <ul className="mt-5 divide-y divide-border border-y border-border">
                {REASONS.map(([l, m]) => (
                  <li key={l}><a href={waUrl(adminPhone, m)} target="_blank" rel="noreferrer noopener" className="flex min-h-14 items-center justify-between gap-4 text-base font-medium hover:underline">{l}<MessageCircle className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden /></a></li>
                ))}
              </ul>
            ) : <p className="mt-4 text-base text-muted-foreground">Contact details are being set up.</p>}
          </div>
          <div>
            <h2 className="text-h3">Contact details</h2>
            <dl className="mt-5 space-y-5 text-base">
              {adminPhone && <div><dt className="text-small text-muted-foreground">Phone and WhatsApp</dt><dd className="mt-1"><ButtonLink href={`tel:${adminPhone}`} variant="secondary"><Phone className="h-4 w-4" aria-hidden /> {adminPhone}</ButtonLink></dd></div>}
              <div><dt className="text-small text-muted-foreground">Email</dt><dd className="mt-1"><ButtonLink href={`mailto:${BRAND.email}`} variant="secondary"><Mail className="h-4 w-4" aria-hidden /> {BRAND.email}</ButtonLink></dd></div>
              {SITE.legal.address && <div><dt className="text-small text-muted-foreground">Address</dt><dd className="mt-1">{SITE.legal.address}</dd></div>}
            </dl>
          </div>
        </Container>
      </Section>
    </>
  );
}
