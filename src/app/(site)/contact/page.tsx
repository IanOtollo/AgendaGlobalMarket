import type { Metadata } from "next";
import { Check, MessageCircle, Phone, Send } from "lucide-react";
import { Container, Section } from "@/components/ds/primitives";
import { ButtonLink } from "@/components/ds/button";
import { CategoryRail } from "@/components/site/category-rail";
import { ContactForm } from "@/components/site/contact-form";
import { ContactCta, PageHero } from "@/components/site/page-parts";
import { BRAND } from "@/lib/config";
import { waUrl } from "@/lib/contact";
import { getPublicSettings } from "@/server/public";

export const metadata: Metadata = {
  title: "Contact us",
  description: `Contact ${BRAND.name} today. Send a message to the office to book a professional, ask a question or report a problem.`,
  alternates: { canonical: "/contact" },
};
export const revalidate = 30; // rebuilt in the background at most this often, so traffic is served from cache

const SERVE = [
  "Diplomatic missions and embassy personnel", "Expatriates and international residents", "Local and international organisations",
  "Private homeowners and landlords", "Residential estates and apartment complexes", "Hotels, offices and commercial establishments",
];
const NEXT = [
  ["Tell us what you need", "Send the form below, or message or call the office. You do not need an account."],
  ["We confirm the details", "The office agrees the time and the price or estimate with you before any work starts."],
  ["The work is done", "A professional arrives at the agreed time, and nothing extra goes ahead without your agreement."],
];

export default async function Page() {
  const settings = await getPublicSettings();
  const { adminPhone } = settings;
  const hello = waUrl(adminPhone, "Hi, I'd like to book a professional.");

  return (
    <>
      <PageHero crumbs={[{ label: "Contact us" }]} title="One call is all it takes." lead={`Contact ${BRAND.name} today and let our team take care of the rest.`}>
        <div className="flex flex-wrap gap-3">
          {/* "Call us" dials the office as soon as its number is saved in Settings; until then it takes people to the form. */}
          <ButtonLink href={adminPhone ? `tel:${adminPhone}` : "#form-h"} variant="accent" size="lg"><Phone className="h-5 w-5" aria-hidden /> Call us</ButtonLink>
          <ButtonLink href="#form-h" variant="primary" size="lg"><Send className="h-5 w-5" aria-hidden /> Send a message</ButtonLink>
          {hello && <ButtonLink href={hello} external variant="secondary" size="lg"><MessageCircle className="h-5 w-5" aria-hidden /> WhatsApp us</ButtonLink>}
        </div>
      </PageHero>

      <Section className="border-t border-border" aria-labelledby="form-h">
        <Container className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
          <div>
            <h2 id="form-h" className="text-h2">Tell us what you need</h2>
            <p className="mt-3 max-w-[56ch] text-base text-muted-foreground">Tell us what it is and where, and the office will take it from there.</p>
            <div className="mt-8"><ContactForm phone={adminPhone} /></div>
          </div>
          <aside aria-labelledby="next-h">
            <h2 id="next-h" className="text-h3">What happens next</h2>
            <ol className="mt-6 space-y-6">
              {NEXT.map(([t, d], i) => (
                <li key={t} className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-[15px] font-bold text-on-accent" aria-hidden>{i + 1}</span>
                  <div><p className="text-base font-semibold">{t}</p><p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">{d}</p></div>
                </li>
              ))}
            </ol>
            <p className="mt-8 rounded-card border border-border bg-muted/50 p-5 text-[15px] leading-relaxed">Questions about prices, cancellations or ratings? The <a href="/help" className="font-medium underline underline-offset-4">FAQ</a> has quick answers.</p>
          </aside>
        </Container>
      </Section>

      <Section className="border-t border-border" aria-labelledby="svc-h">
        <Container>
          <h2 id="svc-h" className="text-h2">Looking for something specific?</h2>
          <p className="mt-3 max-w-[56ch] text-base text-muted-foreground">Pick a service to see the professionals who offer it.</p>
          <div className="mt-8"><CategoryRail /></div>
        </Container>
      </Section>

      <Section className="border-t border-border" aria-labelledby="serve-h">
        <Container>
          <h2 id="serve-h" className="text-h2">Who we serve</h2>
          <p className="mt-3 max-w-[56ch] text-base text-muted-foreground">We proudly extend our services to:</p>
          <ul className="mt-8 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            {SERVE.map((s) => (
              <li key={s} className="flex items-start gap-3 text-base">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-on-accent"><Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden /></span>{s}
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <ContactCta phone={adminPhone} title="Ready to book?" message="Hi, I'd like to book a professional." />
    </>
  );
}
