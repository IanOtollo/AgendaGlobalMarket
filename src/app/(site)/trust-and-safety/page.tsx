import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section } from "@/components/ds/primitives";
import { ContactCta, PageHero } from "@/components/site/page-parts";
import { getPublicSettings } from "@/server/public";

export const metadata: Metadata = { title: "Trust and safety", description: "How bookings are handled, how professionals are listed, and how your information is protected.", alternates: { canonical: "/trust-and-safety" } };
export const dynamic = "force-dynamic";

const POINTS = [
  { t: "One office handles every booking", d: "You always know who to call. The office confirms the time and price with you, and is your contact if anything changes." },
  { t: "Professionals are listed with their details", d: "Before a professional is listed, we review the qualifications and experience they give us. Their profile shows those details, their area and their ratings." },
  { t: "No double-booking", d: "Professionals are scheduled so one person is never booked for two jobs at the same time." },
  { t: "Price confirmed before work starts", d: "The office agrees a price or estimate with you first. Extra work only goes ahead if you agree to it." },
  { t: "Honest ratings", d: "Only customers whose job was completed receive a rating link, and each job can be rated once." },
  { t: "Your location stays with you", d: "Location is used only to sort professionals by distance. It stays on your device and is never sent to the professional or stored on our servers." },
  { t: "Professionals never share their own numbers", d: "Contact goes through the office, so personal phone numbers stay private for customers and professionals alike." },
];

export default function Page() {
  const { adminPhone } = getPublicSettings();
  return (
    <>
      <PageHero crumbs={[{ label: "Trust and safety" }]} title="How we keep bookings straightforward and safe" lead="What we do today, stated plainly." />
      <Section>
        <Container>
          <ul className="grid gap-x-12 gap-y-10 md:grid-cols-2">
            {POINTS.map((p) => <li key={p.t}><h2 className="text-h3">{p.t}</h2><p className="mt-2 max-w-[55ch] text-base leading-relaxed text-muted-foreground">{p.d}</p></li>)}
          </ul>
          <div className="mt-14 max-w-[65ch] rounded-card border border-border bg-card p-6">
            <h2 className="text-h3">If something goes wrong</h2>
            <p className="mt-2 text-base leading-relaxed text-muted-foreground">Contact the office within 7 days of the job being completed. We review it with the professional and, where the work was not up to standard, arrange for it to be put right. See <Link href="/legal/cancellation-refunds" className="font-medium text-foreground underline underline-offset-4">cancellations and refunds</Link> and our <Link href="/legal/privacy" className="font-medium text-foreground underline underline-offset-4">privacy policy</Link>.</p>
          </div>
        </Container>
      </Section>
      <ContactCta phone={adminPhone} title="Questions about safety?" message="Hi, I have a question about trust and safety." />
    </>
  );
}
