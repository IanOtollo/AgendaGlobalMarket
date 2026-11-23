import type { Metadata } from "next";
import { MessageCircle, Phone } from "lucide-react";
import { Container, Highlight, Section } from "@/components/ds/primitives";
import { ButtonLink } from "@/components/ds/button";
import { PageHero } from "@/components/site/page-parts";
import { TrackedLink } from "@/components/site/tracked-link";
import { waUrl } from "@/lib/contact";
import { CATEGORY_LIST } from "@/lib/categories";
import { getPublicSettings } from "@/server/public";

export const metadata: Metadata = { title: "Become a pro", description: "Join the Agenda Global Market network of plumbers, carpenters, masons, electricians and painters. We handle the bookings and scheduling.", alternates: { canonical: "/become-a-pro" } };
export const dynamic = "force-dynamic";

export default function Page() {
  const { adminPhone } = getPublicSettings();
  const apply = waUrl(adminPhone, "Hi, I'd like to apply as a pro.\nTrade:\nYears of experience:\nQualifications:\nArea I'm based in:");
  return (
    <>
      <PageHero crumbs={[{ label: "Become a pro" }]} title={<>Work with <Highlight>Agenda Global Market</Highlight></>} lead="Are you a skilled tradesperson? Join our network and let the office handle bookings and scheduling.">
        {apply ? (
          <div className="flex flex-wrap gap-3">
            <TrackedLink event="pro_apply_clicked" href={apply} external variant="accent" size="lg"><MessageCircle className="h-5 w-5" aria-hidden /> Apply on WhatsApp</TrackedLink>
            <ButtonLink href={`tel:${adminPhone}`} variant="secondary" size="lg"><Phone className="h-5 w-5" aria-hidden /> {adminPhone}</ButtonLink>
          </div>
        ) : <p className="text-base text-muted-foreground">Applications open soon.</p>}
      </PageHero>
      <Section>
        <Container className="grid gap-14 lg:grid-cols-2">
          <div>
            <h2 className="text-h2">What you get</h2>
            <ul className="mt-6 space-y-4 text-base">
              {["Jobs booked for you through one office, so you do not chase customers", "Scheduling handled so your days never clash", "A public profile with your qualifications, experience and ratings", "Customers contact the office, so your personal number stays private"].map((t) => (
                <li key={t} className="flex gap-3"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />{t}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-h2">What to send us</h2>
            <p className="mt-3 text-base text-muted-foreground">Message the office with:</p>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-base">
              <li>Your trade: {CATEGORY_LIST.map((c) => c.name).join(", ")}</li>
              <li>Years of experience</li>
              <li>Your qualifications or certificates</li>
              <li>The area of Nairobi you are based in</li>
            </ol>
            <p className="mt-5 max-w-[55ch] text-[15px] text-muted-foreground">We review what you send and get back to you. Professionals are listed once their details have been reviewed.</p>
          </div>
        </Container>
      </Section>
    </>
  );
}
