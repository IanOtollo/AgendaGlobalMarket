"use client";
import { useEffect, useMemo, useState } from "react";
import { Check, Link2, MessageCircle, Phone, Share2, Star } from "lucide-react";
import { AREA_BY_SLUG } from "@/lib/areas";
import { categorySlug, relatedOf } from "@/lib/trades";
import { distanceKm } from "@/lib/geo";
import { addRecentPro, getRecentPros } from "@/lib/recent";
import { track } from "@/lib/analytics";
import { digits } from "@/lib/utils";
import { Button, ButtonLink } from "@/components/ds/button";
import { Pill } from "@/components/ds/primitives";
import { ProCard, kes } from "./pro-card";
import { useLocation, useSiteData, useTrades } from "./providers";
import Link from "next/link";
import type { PublicPro } from "@/lib/types";

const waLink = (phone: string, p: PublicPro) =>
  `https://wa.me/${digits(phone)}?text=${encodeURIComponent(`Hi, I'd like to book ${p.name} (${p.category}, ref ${p.ref}) in ${p.area}.`)}`;

/** Records the view for analytics and for "Recently viewed". Renders nothing. */
export function ProViewTracker({ pro }: { pro: PublicPro }) {
  useEffect(() => { track("pro_viewed", { slug: pro.slug, trade: pro.category }); addRecentPro(pro.slug); }, [pro.slug, pro.category]);
  return null;
}

export function ShareButton({ title, path }: { title: string; path: string }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = `${window.location.origin}${path}`;
    if (navigator.share) { try { await navigator.share({ title, url }); return; } catch { /* cancelled: fall through to copy */ } }
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };
  return (
    <Button variant="secondary" onClick={share} aria-live="polite">
      {copied ? <><Check className="h-4 w-4" aria-hidden /> Link copied</> : <>{typeof navigator !== "undefined" && "share" in navigator ? <Share2 className="h-4 w-4" aria-hidden /> : <Link2 className="h-4 w-4" aria-hidden />} Share</>}
    </Button>
  );
}

/** "Serves your area" when the visitor's saved position is inside the professional's service radius. */
export function ServesYou({ pro }: { pro: PublicPro }) {
  const loc = useLocation();
  if (!loc.hasLocation || !loc.coords || pro.serviceRadiusKm == null) return null;
  const km = distanceKm(loc.coords, pro);
  return km <= pro.serviceRadiusKm ? <Pill tone="success"><Check className="h-3.5 w-3.5" aria-hidden /> Serves your area</Pill> : <Pill>About {Math.round(km)} km from you</Pill>;
}

/** Sticky booking panel (desktop) and sticky bottom bar (phones). One primary action: WhatsApp the office about this pro. */
export function BookingPanel({ pro, phone }: { pro: PublicPro; phone: string }) {
  const { settings } = useSiteData();
  const tel = settings.adminPhone || phone;
  const first = pro.name.split(" ")[0];
  const book = (channel: string) => track("booking_requested", { slug: pro.slug, channel });
  const price = pro.fromPrice != null ? <>From <strong className="font-semibold">{kes(pro.fromPrice)}</strong> <span className="text-muted-foreground">/ visit</span></> : <span className="text-muted-foreground">Price agreed before work starts</span>;

  return (
    <>
      <aside className="hidden lg:block" aria-label="Booking">
        <div className="sticky top-24 rounded-card border border-border bg-card p-6 shadow-hover">
          <p className="text-xl">{price}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {pro.availability === "today" && <Pill tone="success"><span className="h-2 w-2 rounded-full bg-success" aria-hidden />Available today</Pill>}
            {pro.availability === "week" && <Pill>Available this week</Pill>}
            {pro.availability === "booked" && <Pill tone="warning">Fully booked</Pill>}
            <ServesYou pro={pro} />
          </div>
          {tel ? (
            <div className="mt-6 space-y-2">
              <ButtonLink href={waLink(tel, pro)} external variant="accent" size="lg" block onClick={() => book("whatsapp")}><MessageCircle className="h-5 w-5" aria-hidden /> WhatsApp us about {first}</ButtonLink>
              <div className="text-center"><a href={`tel:${tel}`} onClick={() => book("call")} className="inline-flex min-h-11 items-center gap-2 text-[15px] font-medium underline underline-offset-4"><Phone className="h-4 w-4" aria-hidden /> Or call {tel}</a></div>
            </div>
          ) : <p className="mt-6 rounded-lg bg-muted p-3 text-[15px] text-muted-foreground">Booking contact details are being set up.</p>}
          <ul className="mt-6 space-y-2.5 border-t border-border pt-5 text-[15px]">
            {["One office handles the booking", "We confirm the time and price with you before work starts", "Your location stays on your device"].map((t) => (
              <li key={t} className="flex gap-2.5"><Check className="mt-1 h-4 w-4 shrink-0" aria-hidden />{t}</li>
            ))}
          </ul>
        </div>
      </aside>

      {tel && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-border bg-card px-4 py-3 shadow-hover lg:hidden">
          <div className="min-w-0 flex-1 text-[15px]">
            <p className="truncate font-semibold">{pro.fromPrice != null ? `From ${kes(pro.fromPrice)}` : pro.name}</p>
            {pro.rating.count > 0 && <p className="flex items-center gap-1 text-small text-muted-foreground"><Star className="h-3.5 w-3.5 fill-foreground text-foreground" aria-hidden />{pro.rating.avg.toFixed(1)} ({pro.rating.count})</p>}
          </div>
          <ButtonLink href={waLink(tel, pro)} external variant="accent" onClick={() => book("whatsapp-bar")}><MessageCircle className="h-4 w-4" aria-hidden /> WhatsApp us</ButtonLink>
        </div>
      )}
    </>
  );
}

function Rail({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <section aria-labelledby={id} className="mt-14">
      <h2 id={id} className="text-h3">{title}</h2>
      <div className="-mx-5 mt-5 flex snap-x gap-4 overflow-x-auto px-5 pb-3 sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0 [&>*]:snap-start">{children}</div>
    </section>
  );
}

/** Same trade, nearest first when the visitor's location is known, otherwise best rated. */
export function SimilarPros({ pro }: { pro: PublicPro }) {
  const { pros } = useSiteData();
  const loc = useLocation();
  const list = useMemo(() => {
    const others = pros.filter((p) => p.category === pro.category && p.ref !== pro.ref).map((p) => ({ p, km: loc.coords ? distanceKm(loc.coords, p) : null }));
    return others.sort((a, b) => (a.km != null && b.km != null ? a.km - b.km : b.p.rating.avg - a.p.rating.avg || b.p.years - a.p.years)).slice(0, 8);
  }, [pros, pro, loc.coords]);
  if (!list.length) return null;
  return <Rail id="similar" title={`Similar ${pro.category.toLowerCase()} pros${loc.area ? ` near ${loc.area.name}` : ""}`}>{list.map(({ p, km }) => <ProCard key={p.ref} pro={p} km={km} variant="compact" />)}</Rail>;
}

/** A fixed editorial pairing (never presented as booking history). */
export function RelatedTrades({ pro }: { pro: PublicPro }) {
  const { pros } = useSiteData();
  const trades = useTrades();
  const groups = relatedOf(pro.category, trades).map((t) => ({ trade: t, list: pros.filter((p) => p.category === t).sort((a, b) => b.rating.avg - a.rating.avg || b.years - a.years).slice(0, 2) })).filter((g) => g.list.length);
  if (!groups.length) return null;
  return (
    <section aria-labelledby="related" className="mt-14">
      <h2 id="related" className="text-h3">Related trades</h2>
      <p className="mt-1 text-[15px] text-muted-foreground">Often needed alongside {pro.category.toLowerCase()} work.</p>
      <div className="mt-5 grid gap-8 md:grid-cols-2">
        {groups.map((g) => (
          <div key={g.trade}>
            <Link href={`/services/${categorySlug(g.trade)}`} className="inline-flex min-h-11 items-center text-base font-semibold underline underline-offset-4">{g.trade} professionals</Link>
            <div className="mt-2 grid gap-3">{g.list.map((p) => <ProCard key={p.ref} pro={p} variant="compact" />)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** From localStorage; hidden when empty. */
export function RecentlyViewed({ currentSlug }: { currentSlug: string }) {
  const { pros } = useSiteData();
  const [slugs, setSlugs] = useState<string[]>([]);
  useEffect(() => setSlugs(getRecentPros().filter((s) => s !== currentSlug)), [currentSlug]);
  const list = slugs.map((s) => pros.find((p) => p.slug === s)).filter((p): p is PublicPro => !!p).slice(0, 6);
  if (!list.length) return null;
  return <Rail id="recent" title="Recently viewed">{list.map((p) => <ProCard key={p.ref} pro={p} variant="compact" />)}</Rail>;
}

export { AREA_BY_SLUG };
