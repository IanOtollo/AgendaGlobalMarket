import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Award, Clock, Languages, MapPin, Star, Wrench } from "lucide-react";
import { Breadcrumbs, Container, Pill } from "@/components/ds/primitives";
import { Gallery } from "@/components/site/gallery";
import { ProAvatar, RatingLine, kes } from "@/components/site/pro-card";
import { BookingPanel, ProViewTracker, RecentlyViewed, RelatedTrades, ServesYou, ShareButton, SimilarPros } from "@/components/site/pro-actions";
import { JsonLd, breadcrumbLd, proLd } from "@/lib/schema";
import { categorySlug } from "@/lib/trades";
import { getPublicPros, getPublicSettings } from "@/server/public";

export const dynamic = "force-dynamic";

const find = async (slug: string) => (await getPublicPros()).find((p) => p.slug === slug);
const month = (m: string) => new Date(`${m}-01T00:00:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await find(params.slug);
  if (!p) return { title: "Professional not found" };
  const rating = p.rating.count ? ` Rated ${p.rating.avg.toFixed(1)} out of 5 from ${p.rating.count} ${p.rating.count === 1 ? "review" : "reviews"}.` : "";
  return {
    title: `${p.name}, ${p.category.toLowerCase()} in ${p.area}`,
    description: `${p.name} is a ${p.category.toLowerCase()} based in ${p.area}, Nairobi with ${p.years} ${p.years === 1 ? "year" : "years"} of experience.${rating} Book through one office.`,
    alternates: { canonical: `/pros/${p.slug}` },
  };
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-32 border-t border-border py-8">
      <h2 id={`${id}-h`} className="text-h3">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function ProPage({ params }: { params: { slug: string } }) {
  const pro = await find(params.slug);
  if (!pro) notFound();
  const { adminPhone } = await getPublicSettings();
  const crumbs = [{ label: "Home", href: "/" }, { label: "Services", href: "/services" }, { label: pro.category, href: `/services/${categorySlug(pro.category)}` }, { label: pro.name }];
  const hasReviews = pro.rating.count > 0;
  const anchors = [["about", "About"], ...(pro.fromPrice != null ? [["pricing", "Pricing"]] : []), ...(pro.qualifications.length ? [["credentials", "Credentials"]] : []), ...(hasReviews ? [["reviews", "Reviews"]] : []), ["area", "Service area"]];

  return (
    <>
      <JsonLd data={proLd(pro)} />
      <JsonLd data={breadcrumbLd(crumbs)} />
      <ProViewTracker pro={pro} />
      <Container className="pb-28 pt-6 lg:pb-16 lg:pt-8">
        <Breadcrumbs items={crumbs} />

        <div className="mt-6 grid gap-12 lg:grid-cols-[1fr_22rem]">
          <div className="min-w-0">
            {pro.gallery?.length ? <div className="mb-8"><Gallery images={pro.gallery} alt={pro.name} /></div> : null}

            <header className="grid gap-6 sm:grid-cols-[13rem_1fr] sm:items-center">
              <div className="vt-pro-hero aspect-square w-40 overflow-hidden rounded-card sm:w-full"><ProAvatar pro={pro} size="xl" /></div>
              <div className="min-w-0">
                <h1 className="text-h1">{pro.name}</h1>
                <p className="mt-1 text-lg text-muted-foreground">{pro.category} · {pro.area}</p>
                <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[15px]">
                  <RatingLine pro={pro} />
                  <span aria-hidden className="text-muted-foreground">·</span>
                  <span>{pro.years} {pro.years === 1 ? "year" : "years"} experience</span>
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {pro.availability === "today" && <Pill tone="success"><span className="h-2 w-2 rounded-full bg-success" aria-hidden />Available today</Pill>}
                  {pro.availability === "week" && <Pill>Available this week</Pill>}
                  {pro.availability === "booked" && <Pill tone="warning">Fully booked</Pill>}
                  <ServesYou pro={pro} />
                  <ShareButton title={`${pro.name}, ${pro.category.toLowerCase()} in ${pro.area}`} path={`/pros/${pro.slug}`} />
                </div>
              </div>
            </header>

            <nav aria-label="On this page" className="sticky top-16 z-20 -mx-5 mt-8 overflow-x-auto border-b border-border bg-background/95 px-5 backdrop-blur sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0">
              <ul className="flex gap-6 text-[15px] font-medium">
                {anchors.map(([id, label]) => <li key={id}><a href={`#${id}`} className="inline-flex min-h-12 items-center text-muted-foreground hover:text-foreground">{label}</a></li>)}
              </ul>
            </nav>

            <Section id="about" title="About">
              {pro.bio && <p className="max-w-[65ch] text-base leading-relaxed">{pro.bio}</p>}
              <dl className="mt-5 grid gap-x-8 gap-y-3 text-[15px] sm:grid-cols-2">
                <div className="flex items-center gap-3"><Wrench className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden /><dt className="text-muted-foreground">Trade</dt><dd className="font-medium">{pro.category}</dd></div>
                <div className="flex items-center gap-3"><Clock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden /><dt className="text-muted-foreground">Experience</dt><dd className="font-medium">{pro.years} {pro.years === 1 ? "year" : "years"}</dd></div>
                <div className="flex items-center gap-3"><MapPin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden /><dt className="text-muted-foreground">Based in</dt><dd className="font-medium">{pro.area}</dd></div>
                {pro.languages?.length ? <div className="flex items-center gap-3"><Languages className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden /><dt className="text-muted-foreground">Languages</dt><dd className="font-medium">{pro.languages.join(", ")}</dd></div> : null}
              </dl>
            </Section>

            {pro.fromPrice != null && (
              <Section id="pricing" title="Pricing">
                <p className="text-base"><strong className="text-xl font-semibold">From {kes(pro.fromPrice)}</strong> <span className="text-muted-foreground">per visit</span></p>
                <p className="mt-2 max-w-[65ch] text-[15px] text-muted-foreground">The final price depends on the job. The office confirms it with you before any work starts.</p>
              </Section>
            )}

            {pro.qualifications.length > 0 && (
              <Section id="credentials" title="Credentials">
                <ul className="space-y-3">
                  {pro.qualifications.map((q) => <li key={q} className="flex items-start gap-3 text-base"><Award className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.5} aria-hidden />{q}</li>)}
                </ul>
              </Section>
            )}

            {hasReviews && (
              <Section id="reviews" title="Reviews">
                <div className="grid gap-6 sm:grid-cols-[10rem_1fr] sm:items-center">
                  <div>
                    <p className="text-5xl font-semibold tracking-tight">{pro.rating.avg.toFixed(1)}</p>
                    <p className="mt-1 text-[15px] text-muted-foreground">{pro.rating.count} {pro.rating.count === 1 ? "rating" : "ratings"}</p>
                  </div>
                  <ul className="space-y-1.5" aria-label="Rating breakdown">
                    {[5, 4, 3, 2, 1].map((n) => (
                      <li key={n} className="flex items-center gap-3 text-[15px]">
                        <span className="w-12 shrink-0">{n} star{n > 1 ? "s" : ""}</span>
                        <progress value={pro.rating.dist[n - 1]} max={pro.rating.count} aria-label={`${pro.rating.dist[n - 1]} of ${pro.rating.count} ratings are ${n} stars`}
                          className="h-2 w-full appearance-none overflow-hidden rounded-full [&::-moz-progress-bar]:bg-foreground [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-foreground" />
                        <span className="w-6 shrink-0 text-right text-muted-foreground">{pro.rating.dist[n - 1]}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {pro.reviews.length > 0 && (
                  <>
                    <ul className="mt-8 divide-y divide-border">
                      {pro.reviews.slice(0, 5).map((r, i) => <ReviewItem key={i} r={r} />)}
                    </ul>
                    {pro.reviews.length > 5 && (
                      <details className="group mt-2">
                        <summary className="inline-flex min-h-11 cursor-pointer list-none items-center text-[15px] font-semibold underline underline-offset-4 [&::-webkit-details-marker]:hidden">See all {pro.reviews.length} reviews</summary>
                        <ul className="divide-y divide-border">{pro.reviews.slice(5).map((r, i) => <ReviewItem key={i} r={r} />)}</ul>
                      </details>
                    )}
                  </>
                )}
              </Section>
            )}

            <Section id="area" title="Service area">
              <p className="flex items-center gap-2 text-base"><MapPin className="h-5 w-5 shrink-0" strokeWidth={1.5} aria-hidden /><span>Based in <strong className="font-semibold">{pro.area}</strong>, Nairobi{pro.serviceRadiusKm != null ? `, serving up to ${pro.serviceRadiusKm} km around` : ""}.</span></p>
              <p className="mt-2 max-w-[65ch] text-[15px] text-muted-foreground">We show the area, never an exact address.</p>
            </Section>
          </div>

          <BookingPanel pro={pro} phone={adminPhone} />
        </div>

        <SimilarPros pro={pro} />
        <RelatedTrades pro={pro} />
        <RecentlyViewed currentSlug={pro.slug} />
      </Container>
    </>
  );
}

function ReviewItem({ r }: { r: { stars: number; comment: string; month: string } }) {
  return (
    <li className="py-5">
      <p className="flex items-center gap-1" aria-label={`${r.stars} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={n <= r.stars ? "h-4 w-4 fill-foreground text-foreground" : "h-4 w-4 text-border-strong"} aria-hidden />)}
        <span className="ml-2 text-small text-muted-foreground">{month(r.month)}</span>
      </p>
      <p className="mt-2 max-w-[65ch] text-base leading-relaxed">{r.comment}</p>
    </li>
  );
}
