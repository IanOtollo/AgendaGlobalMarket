import Link from "next/link";
import { ArrowUpRight, MessageCircle, Phone } from "lucide-react";
import { BRAND } from "@/lib/config";
import { tradesOf } from "@/lib/trades";
import type { Trade } from "@/lib/types";
import { SITE } from "@/lib/site";
import { digits } from "@/lib/utils";
import { ButtonLink } from "@/components/ds/button";
import { Container } from "@/components/ds/primitives";
import { BrandMarkDark } from "./brand-dark";

const col = "text-[15px] text-inverse-foreground/75";
const link = "inline-flex min-h-11 items-center hover:text-inverse-foreground hover:underline";

/** Server component. Every line is real: contact details come from settings, legal details only appear once filled in. */
export function SiteFooter({ phone, trades }: { phone: string; trades: Trade[] }) {
  const CATEGORY_LIST = tradesOf({ trades });
  const wa = (t: string) => `https://wa.me/${digits(phone)}?text=${encodeURIComponent(t)}`;
  const entity = SITE.legal.entity || BRAND.name;
  return (
    <footer className="on-dark print:hidden bg-inverse text-inverse-foreground">
      <Container className="py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <BrandMarkDark />
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-inverse-foreground/75">
              Your trusted property maintenance partner. Premium home, office and building care services, booked through one office.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/become-a-pro" variant="accent">Apply as a pro</ButtonLink>
              {phone && <ButtonLink href={wa("Hi, I have a question about your services.")} external variant="secondary" className="!border-inverse-foreground/40 !bg-transparent !text-inverse-foreground hover:!bg-inverse-foreground/10"><MessageCircle className="h-4 w-4" aria-hidden /> WhatsApp us</ButtonLink>}
            </div>
            <ul className={`mt-6 space-y-1 ${col}`}>
              {phone && <li><a href={`tel:${phone}`} className={link}><Phone className="mr-2 h-4 w-4" aria-hidden />{phone}</a></li>}
              <li><a href={`mailto:${BRAND.email}`} className={`${link} break-all`}>{BRAND.email}</a></li>
            </ul>
          </div>

          <nav aria-label="Services">
            <p className="text-[15px] font-semibold">Services</p>
            <ul className={`mt-3 space-y-0.5 ${col}`}>
              {CATEGORY_LIST.map((c) => <li key={c.slug}><Link href={`/services/${c.slug}`} className={link}>{c.name}</Link></li>)}
              <li><Link href="/services" className={`${link} font-medium`}>All services</Link></li>
            </ul>
          </nav>

          <nav aria-label="Company">
            <p className="text-[15px] font-semibold">Company</p>
            <ul className={`mt-3 space-y-0.5 ${col}`}>
              {[["About us", "/about"], ["How it works", "/how-it-works"], ["Trust and safety", "/trust-and-safety"], ["For pros", "/become-a-pro"]].map(([l, h]) => <li key={h}><Link href={h} className={link}>{l}</Link></li>)}
            </ul>
          </nav>

          <nav aria-label="Support">
            <p className="text-[15px] font-semibold">Support</p>
            <ul className={`mt-3 space-y-0.5 ${col}`}>
              {[["Help centre", "/help"], ["Contact us", "/contact"], ["Cancellations and refunds", "/legal/cancellation-refunds"], ["Accessibility", "/accessibility"]].map(([l, h]) => <li key={h}><Link href={h} className={link}>{l}</Link></li>)}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-inverse-foreground/15 pt-8 text-small text-inverse-foreground/70 lg:flex-row lg:items-center lg:justify-between">
          <p>© {new Date().getFullYear()} {entity}.{SITE.legal.registrationNo ? ` Reg. ${SITE.legal.registrationNo}.` : ""} All rights reserved.</p>
          <ul className="flex flex-wrap gap-x-5">
            {[["Terms", "/legal/terms"], ["Privacy", "/legal/privacy"], ["Cookies", "/legal/cookies"], ["Pro Agreement", "/legal/pro-agreement"], ["Acceptable use", "/legal/acceptable-use"], ["Accessibility", "/accessibility"]].map(([l, h]) => (
              <li key={h}><Link href={h} className={link}>{l}</Link></li>
            ))}
          </ul>
        </div>

        <p className="mt-4 text-center text-small">
          <a href="https://marabimadeit.co.ke" target="_blank" rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1 text-inverse-foreground/70 underline underline-offset-4 hover:text-inverse-foreground">
            Marabi made it <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </a>
        </p>
      </Container>
    </footer>
  );
}
