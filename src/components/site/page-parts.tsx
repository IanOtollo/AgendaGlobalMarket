import type { ReactNode } from "react";
import { MessageCircle, Phone } from "lucide-react";
import { Breadcrumbs, Container, Section } from "@/components/ds/primitives";
import { ButtonLink } from "@/components/ds/button";
import { waUrl } from "@/lib/contact";
import { JsonLd, breadcrumbLd } from "@/lib/schema";

/** Standard page header: breadcrumbs, H1, one-line lead. */
export function PageHero({ crumbs, title, lead, children }: { crumbs: { label: string; href?: string }[]; title: ReactNode; lead?: string; children?: ReactNode }) {
  return (
    <Section className="border-b border-border !pb-12 !pt-8 md:!pt-12">
      <JsonLd data={breadcrumbLd([{ label: "Home", href: "/" }, ...crumbs])} />
      <Container>
        <Breadcrumbs items={[{ label: "Home", href: "/" }, ...crumbs]} />
        <h1 className="mt-4 max-w-[22ch] text-h1">{title}</h1>
        {lead && <p className="mt-4 max-w-[60ch] text-lg leading-relaxed text-muted-foreground">{lead}</p>}
        {children && <div className="mt-8">{children}</div>}
      </Container>
    </Section>
  );
}

/** Closing call to action: message the office. Hidden if no contact line is set. */
export function ContactCta({ phone, title = "Ready to book?", message = "Hi, I'd like to book a professional." }: { phone: string; title?: string; message?: string }) {
  if (!phone) return null;
  return (
    <Section className="on-dark bg-inverse text-inverse-foreground">
      <Container className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
        <div><h2 className="text-h2">{title}</h2><p className="mt-2 text-base text-inverse-foreground/75">Message the office or call. One number for everything.</p></div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={waUrl(phone, message)} external variant="accent" size="lg"><MessageCircle className="h-5 w-5" aria-hidden /> WhatsApp us</ButtonLink>
          <ButtonLink href={`tel:${phone}`} variant="secondary" size="lg" className="!border-inverse-foreground/40 !bg-transparent !text-inverse-foreground hover:!bg-inverse-foreground/10"><Phone className="h-5 w-5" aria-hidden /> {phone}</ButtonLink>
        </div>
      </Container>
    </Section>
  );
}

/** Readable long-form block (65ch measure). */
export function Prose({ children }: { children: ReactNode }) {
  return <div className="max-w-[65ch] space-y-5 text-base leading-relaxed [&_h2]:mt-10 [&_h2]:text-h3 [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ul]:space-y-2">{children}</div>;
}
