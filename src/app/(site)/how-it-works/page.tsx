import type { Metadata } from "next";
import { Container, Section } from "@/components/ds/primitives";
import { ContactCta, PageHero } from "@/components/site/page-parts";
import { getPublicSettings } from "@/server/public";

export const metadata: Metadata = { title: "How it works", description: "Choose a trade, message the office, and we confirm the time and price before work starts. One point of contact from first call to finished job.", alternates: { canonical: "/how-it-works" } };
export const dynamic = "force-dynamic";

const STEPS = [
  { t: "Choose a trade", d: "Browse plumbers, carpenters, masons, electricians and painters. Each profile shows experience, qualifications, ratings and the area they are based in. Allow your location, or pick an area, to see who is nearest." },
  { t: "Message the office", d: "Tap WhatsApp or call the office number. Tell us what needs doing and when. You do not need an account, and you never need to contact the professional directly." },
  { t: "We confirm the details", d: "The office agrees the time and the price or estimate with you before any work starts, and checks the professional is free so they are never double-booked." },
  { t: "The work is done", d: "The professional arrives at the agreed time. If the job needs more work than expected, you are told first and nothing extra goes ahead without your agreement." },
  { t: "You rate the job", d: "When the job is complete we send you a link to rate the professional. Only customers whose job was completed can leave a rating." },
];

export default async function Page() {
  const { adminPhone } = await getPublicSettings();
  return (
    <>
      <PageHero crumbs={[{ label: "How it works" }]} title="One office, from first call to finished job" lead="Five clear steps, and one number to call at every one of them." />
      <Section>
        <Container>
          <ol className="max-w-3xl divide-y divide-border border-y border-border">
            {STEPS.map((s, i) => (
              <li key={s.t} className="flex gap-5 py-7">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-inverse text-base font-semibold text-inverse-foreground" aria-hidden>{i + 1}</span>
                <div><h2 className="text-h3">{s.t}</h2><p className="mt-2 max-w-[60ch] text-base leading-relaxed text-muted-foreground">{s.d}</p></div>
              </li>
            ))}
          </ol>
        </Container>
      </Section>
      <ContactCta phone={adminPhone} />
    </>
  );
}
