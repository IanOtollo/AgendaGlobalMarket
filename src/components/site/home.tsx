"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, MapPin, MessageCircle, Star } from "lucide-react";
import { CATEGORY_LIST, categoryBySlug } from "@/lib/categories";
import { distanceKm } from "@/lib/geo";
import { cn, digits } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { Button, ButtonLink } from "@/components/ds/button";
import { Container, Highlight, Section } from "@/components/ds/primitives";
import { CategoryRail } from "./category-rail";
import { ProCard, ProGrid } from "./pro-card";
import { useLocation, useSiteData, useSiteUi } from "./providers";
import { SearchBox } from "./search-box";
import { HeroIllustration } from "./hero-illustration";

export function HomeHero() {
  const loc = useLocation();
  const { setHeroSearchVisible } = useSiteUi();
  const searchWrap = useRef<HTMLDivElement>(null);

  // Hands the search over to the header once the hero search scrolls out of view.
  useEffect(() => {
    const el = searchWrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setHeroSearchVisible(e.isIntersecting), { rootMargin: "-64px 0px 0px 0px" });
    io.observe(el);
    return () => { io.disconnect(); setHeroSearchVisible(false); };
  }, [setHeroSearchVisible]);

  const place = loc.hasLocation && loc.area ? loc.area.name : null;
  return (
    <Section className="!py-12 md:!py-16 lg:!py-20">
      <Container className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        <div>
          <h1 className="text-display">
            {place ? <>Home repairs in {place}, done properly.</> : <>Home repairs and maintenance in Nairobi, done properly.</>}
          </h1>
          <p className="mt-5 max-w-[34rem] text-lg leading-relaxed text-muted-foreground">
            Book qualified plumbers, electricians, carpenters, masons and painters near you through one office.
          </p>
          <div ref={searchWrap} className="mt-8 max-w-2xl"><SearchBox variant="hero" /></div>
          <p className="mt-5 flex flex-wrap items-center gap-x-1 gap-y-1 text-[15px] text-muted-foreground">
            <span className="mr-1">Popular:</span>
            {CATEGORY_LIST.map((c, i) => (
              <span key={c.slug}><Link href={`/services/${c.slug}`} className="inline-flex min-h-11 items-center font-medium text-foreground underline-offset-4 hover:underline">{c.name}</Link>{i < CATEGORY_LIST.length - 1 && <span aria-hidden className="mx-1">·</span>}</span>
            ))}
          </p>
        </div>
        <HeroIllustration />
      </Container>
    </Section>
  );
}

/** Trade rail filters the list in place and keeps the URL (?trade=) in step. */
export function HomeResults() {
  const router = useRouter();
  const sp = useSearchParams();
  const { pros } = useSiteData();
  const loc = useLocation();
  const trade = categoryBySlug(sp.get("trade") ?? "")?.name ?? null;

  const rows = useMemo(() => {
    const list = pros.filter((p) => !trade || p.category === trade).map((p) => ({ p, km: loc.coords ? distanceKm(loc.coords, p) : null }));
    return list.sort((a, b) => (a.km != null && b.km != null ? a.km - b.km : b.p.rating.avg - a.p.rating.avg || b.p.years - a.p.years));
  }, [pros, trade, loc.coords]);

  const select = (name: string | null) => {
    const next = new URLSearchParams(sp.toString());
    const slug = name ? CATEGORY_LIST.find((c) => c.name === name)?.slug : null;
    slug ? next.set("trade", slug) : next.delete("trade");
    router.replace(`/${next.size ? `?${next}` : ""}`, { scroll: false });
  };
  const seeAll = trade ? `/services/${categoryBySlug(sp.get("trade") ?? "")?.slug}${loc.area ? `?area=${loc.area.slug}` : ""}` : `/services${loc.area ? `?area=${loc.area.slug}` : ""}`;

  return (
    <>
      <Section className="!pb-6 !pt-0 md:!pb-8">
        <Container>
          <h2 className="sr-only">Browse by trade</h2>
          <CategoryRail selected={trade} onSelect={select} />
        </Container>
      </Section>
      <Section className="!pt-6 md:!pt-8" id="pros-near-you">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-h2">{loc.hasLocation && loc.area ? `${trade ?? "Pros"} near ${loc.area.name}` : `Top-rated${trade ? ` ${trade.toLowerCase()} pros` : ""} in Nairobi`}</h2>
              {!loc.hasLocation && (
                <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] text-muted-foreground">
                  <MapPin className="h-4 w-4" aria-hidden /> Show pros closest to you
                  <Button variant="secondary" onClick={() => { loc.openSheet(); }}>Use my location</Button>
                </p>
              )}
            </div>
            {rows.length > 8 && <Link href={seeAll} className="inline-flex min-h-11 items-center gap-1.5 text-base font-semibold underline-offset-4 hover:underline">See all {rows.length} pros{loc.area ? ` near ${loc.area.name}` : ""} <ArrowRight className="h-4 w-4" aria-hidden /></Link>}
          </div>
          <div className="mt-8" aria-live="polite">
            {rows.length > 0 ? <ProGrid>{rows.slice(0, 8).map(({ p, km }) => <ProCard key={p.ref} pro={p} km={km} />)}</ProGrid> : (
              <p className="rounded-card border border-dashed border-border-strong px-6 py-12 text-center text-base text-muted-foreground">No professionals are listed for this trade yet. Message us and we will arrange one.</p>
            )}
          </div>
          {rows.length <= 8 && rows.length > 0 && <div className="mt-8"><ButtonLink href={seeAll} variant="secondary">Browse all services <ArrowRight className="h-4 w-4" aria-hidden /></ButtonLink></div>}
        </Container>
      </Section>
    </>
  );
}

/** Dark band. Only statements that are true of how the service works today; no figures. */
export function TrustBand() {
  const points = [
    ["One office", "Every booking goes through one number, so you always know who to call."],
    ["No double-booking", "Professionals are scheduled so one person is never in two places at once."],
    ["Price confirmed first", "We agree the price or estimate with you before work starts."],
    ["Honest ratings", "Only customers whose job was completed can leave a rating."],
  ];
  return (
    <section className="on-dark bg-inverse py-16 text-inverse-foreground md:py-24" aria-labelledby="trust-h">
      <Container>
        <h2 id="trust-h" className="max-w-[20ch] text-h2">Why customers book through us</h2>
        <ul className="mt-12 grid gap-8 border-t border-inverse-foreground/20 pt-10 sm:grid-cols-2 lg:grid-cols-4">
          {points.map(([t, d]) => <li key={t}><h3 className="text-lg font-semibold">{t}</h3><p className="mt-2 text-[15px] leading-relaxed text-inverse-foreground/75">{d}</p></li>)}
        </ul>
      </Container>
    </section>
  );
}

/** Real review text only. Hidden entirely until there is some. */
export function SocialProof() {
  const { pros } = useSiteData();
  const reviews = useMemo(() => pros.flatMap((p) => p.reviews.map((r) => ({ ...r, pro: p }))).sort((a, b) => b.month.localeCompare(a.month)).slice(0, 3), [pros]);
  if (!reviews.length) return null;
  return (
    <Section aria-labelledby="proof-h">
      <Container>
        <h2 id="proof-h" className="text-h2">What customers say</h2>
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {reviews.map((r, i) => (
            <li key={i} className="flex flex-col rounded-card border border-border bg-card p-6">
              <p className="flex items-center gap-0.5" aria-label={`${r.stars} out of 5 stars`}>{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={n <= r.stars ? "h-4 w-4 fill-foreground text-foreground" : "h-4 w-4 text-border-strong"} aria-hidden />)}</p>
              <blockquote className="mt-4 flex-1 text-base leading-relaxed">“{r.comment}”</blockquote>
              <p className="mt-4 text-[15px] text-muted-foreground">Customer of <Link href={`/pros/${r.pro.slug}`} className="font-medium text-foreground underline underline-offset-4">{r.pro.name}</Link>, {r.pro.category.toLowerCase()}</p>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

export function BecomeProBand() {
  return (
    <Section className="border-y border-border bg-muted">
      <Container className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <h2 className="text-h2">Work with <Highlight>Agenda Global Market</Highlight></h2>
          <p className="mt-4 max-w-[52ch] text-lg text-muted-foreground">Are you a skilled tradesperson? Join our network and let us handle the bookings.</p>
          <div className="mt-8"><ButtonLink href="/become-a-pro" variant="primary" size="lg" onClick={() => track("pro_apply_clicked", { from: "home" })}>Apply as a pro</ButtonLink></div>
        </div>
        <ul className="space-y-4 text-base">
          {["Jobs booked for you through one office", "Scheduling handled so your days do not clash", "A rated public profile customers can check"].map((t) => (
            <li key={t} className="flex gap-3"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />{t}</li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

export function FinalCta() {
  const { settings } = useSiteData();
  const wa = `https://wa.me/${digits(settings.adminPhone)}?text=${encodeURIComponent("Hi, I'd like to book a professional.")}`;
  return (
    <Section>
      <Container className="max-w-3xl text-center">
        <h2 className="text-h1">Ready when <Highlight>you are.</Highlight></h2>
        <p className="mx-auto mt-4 max-w-[48ch] text-lg text-muted-foreground">Find a pro near you, or message the office and we will arrange one.</p>
        <div className="mx-auto mt-8 max-w-2xl text-left"><SearchBox variant="hero" /></div>
        {settings.adminPhone && <div className="mt-6"><ButtonLink href={wa} external variant="link"><MessageCircle className="h-4 w-4" aria-hidden /> Or message us on WhatsApp</ButtonLink></div>}
      </Container>
    </Section>
  );
}
