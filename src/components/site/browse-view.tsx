"use client";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MapPin, MessageCircle, SlidersHorizontal, X } from "lucide-react";
import { AREA_BY_SLUG, AREA_LIST } from "@/lib/areas";
import { distanceKm } from "@/lib/geo";
import { RADII } from "@/lib/location";
import { track } from "@/lib/analytics";
import { cn, digits } from "@/lib/utils";
import { Button, ButtonLink } from "@/components/ds/button";
import { Chip } from "@/components/ds/primitives";
import { Sheet } from "@/components/ds/sheet";
import { ProCard, ProGrid } from "./pro-card";
import { kes } from "@/lib/kes";
import { useLocation, useSiteData } from "./providers";
import type { PublicPro } from "@/lib/types";

const PAGE = 12;
type Sort = "nearest" | "top" | "price" | "experience";
const SORTS: { value: Sort; label: string }[] = [
  { value: "nearest", label: "Nearest" }, { value: "top", label: "Top rated" }, { value: "price", label: "Lowest price" }, { value: "experience", label: "Most experienced" },
];

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

/**
 * Filterable list of professionals. ALL filter state lives in the URL (shareable, back-button safe) and never contains
 * coordinates: distance uses an area slug, or the visitor's position kept in memory.
 * `category` / `areaLock` fix the trade or area for category and SEO landing pages.
 */
export function BrowseView({ category, areaLock }: { category?: string; areaLock?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const { pros, settings } = useSiteData();
  const loc = useLocation();
  const [pending, start] = useTransition();
  const [sheet, setSheet] = useState(false);
  const [shown, setShown] = useState(PAGE);
  const sentinel = useRef<HTMLDivElement>(null);

  const areaSlug = areaLock ?? sp.get("area") ?? "";
  const radiusParam = Number(sp.get("radius")) || 0;
  const ratingMin = Number(sp.get("rating")) || 0;
  const avail = sp.get("avail") ?? "";
  const lang = sp.get("lang") ?? "";
  const q = sp.get("q") ?? "";
  const [pMin, pMax] = (sp.get("price") ?? "").split("-").map(Number);

  // URL writer. `replace` so filtering does not fill the history; `scroll:false` so the page does not jump.
  const update = useCallback((patch: Record<string, string | null>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) (v ? next.set(k, v) : next.delete(k));
    track("filter_changed", { filter: Object.keys(patch).join(",") });
    start(() => router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false }));
  }, [sp, pathname, router]);

  // Debounced inputs (text search and price sliders) so typing and dragging do not hammer the URL.
  const [qDraft, setQDraft] = useState(q);
  const qDebounced = useDebounced(qDraft, 250);
  useEffect(() => { if (qDebounced !== q) update({ q: qDebounced || null }); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [qDebounced]);
  useEffect(() => setQDraft(q), [q]);

  const base = useMemo(() => pros.filter((p) => !category || p.category === category), [pros, category]);
  const priceBounds = useMemo(() => {
    const ps = base.map((p) => p.fromPrice).filter((n): n is number => typeof n === "number");
    return ps.length ? { min: Math.min(...ps), max: Math.max(...ps) } : null;
  }, [base]);
  const languages = useMemo(() => [...new Set(base.flatMap((p) => p.languages ?? []))].sort(), [base]);
  const [priceDraft, setPriceDraft] = useState<[number, number] | null>(null);
  const priceDebounced = useDebounced(priceDraft, 250);
  useEffect(() => {
    if (!priceDebounced || !priceBounds) return;
    const [lo, hi] = priceDebounced;
    const next = lo <= priceBounds.min && hi >= priceBounds.max ? null : `${lo}-${hi}`;
    if (next !== (sp.get("price") ?? null)) update({ price: next });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceDebounced]);
  const priceLo = Number.isFinite(pMin) && priceBounds ? pMin : priceBounds?.min ?? 0;
  const priceHi = Number.isFinite(pMax) && priceBounds ? pMax : priceBounds?.max ?? 0;

  // Where "near" is measured from: a chosen area, else the visitor's saved location. Never sent anywhere.
  const ref = areaSlug && AREA_BY_SLUG[areaSlug] ? AREA_BY_SLUG[areaSlug] : loc.hasLocation ? loc.coords : null;
  const refName = areaSlug && AREA_BY_SLUG[areaSlug] ? AREA_BY_SLUG[areaSlug].name : loc.hasLocation ? loc.area?.name : null;
  const sort: Sort = (SORTS.find((s) => s.value === sp.get("sort"))?.value) ?? (ref ? "nearest" : "top");

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    const list = base
      .map((p) => ({ p, km: ref ? distanceKm(ref, p) : null }))
      .filter(({ p, km }) =>
        (!t || [p.name, p.category, p.area, ...p.qualifications].some((s) => s.toLowerCase().includes(t))) &&
        (!radiusParam || km == null || km <= radiusParam) &&
        (!ratingMin || (p.rating.count > 0 && p.rating.avg >= ratingMin)) &&
        (!avail || (avail === "today" ? p.availability === "today" : p.availability === "today" || p.availability === "week")) &&
        (!lang || p.languages?.includes(lang)) &&
        (!sp.get("price") || (p.fromPrice != null && p.fromPrice >= priceLo && p.fromPrice <= priceHi)));
    const top = (a: PublicPro, b: PublicPro) => b.rating.avg - a.rating.avg || b.rating.count - a.rating.count || b.years - a.years;
    return list.sort((a, b) =>
      sort === "nearest" && a.km != null && b.km != null ? a.km - b.km :
      sort === "price" ? (a.p.fromPrice ?? Infinity) - (b.p.fromPrice ?? Infinity) :
      sort === "experience" ? b.p.years - a.p.years : top(a.p, b.p));
  }, [base, ref, q, radiusParam, ratingMin, avail, lang, sp, priceLo, priceHi, sort]);

  useEffect(() => setShown(PAGE), [rows.length, sort, category]);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => e[0].isIntersecting && setShown((n) => n + PAGE), { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, [rows.length]);

  const activeChips: { label: string; clear: Record<string, string | null> }[] = [];
  if (!areaLock && areaSlug && AREA_BY_SLUG[areaSlug]) activeChips.push({ label: AREA_BY_SLUG[areaSlug].name, clear: { area: null } });
  if (radiusParam) activeChips.push({ label: `Within ${radiusParam} km`, clear: { radius: null } });
  if (ratingMin) activeChips.push({ label: `${ratingMin}+ rating`, clear: { rating: null } });
  if (avail) activeChips.push({ label: avail === "today" ? "Available today" : "Available this week", clear: { avail: null } });
  if (sp.get("price")) activeChips.push({ label: `${kes(priceLo)} to ${kes(priceHi)}`, clear: { price: null } });
  if (lang) activeChips.push({ label: lang, clear: { lang: null } });
  if (q) activeChips.push({ label: `“${q}”`, clear: { q: null } });
  const clearAll = () => update({ area: areaLock ? null : null, radius: null, rating: null, avail: null, price: null, lang: null, q: null });

  const trade = category ? category.toLowerCase() : "professional";
  const heading = `${rows.length} ${rows.length === 1 ? trade : trade === "professional" ? "professionals" : `${trade} pros`}${refName ? ` near ${refName}` : " in Nairobi"}`;
  const wa = `https://wa.me/${digits(settings.adminPhone)}?text=${encodeURIComponent(`Hi, I'm looking for ${category ? `a ${category.toLowerCase()} professional` : "a professional"}${refName ? ` near ${refName}` : ""}.`)}`;
  const nextRadius = RADII.find((r) => r > (radiusParam || 0));

  const panel = (
    <div className="space-y-7">
      {!areaLock && (
        <fieldset>
          <legend className="text-[15px] font-semibold">Area</legend>
          <label className="sr-only" htmlFor="area-select">Area</label>
          <select id="area-select" value={areaSlug} onChange={(e) => update({ area: e.target.value || null })} className="mt-2 h-11 w-full rounded-lg border border-border-strong bg-card px-3 text-[15px]">
            <option value="">{loc.hasLocation && loc.area ? `Near ${loc.area.name} (my location)` : "All of Nairobi"}</option>
            {AREA_LIST.map((a) => <option key={a.slug} value={a.slug}>{a.name}</option>)}
          </select>
        </fieldset>
      )}
      <fieldset>
        <legend className="text-[15px] font-semibold">Distance</legend>
        {ref ? (
          <div className="mt-2 flex flex-wrap gap-2">
            <Chip selected={!radiusParam} onClick={() => update({ radius: null })}>Any</Chip>
            {RADII.map((r) => <Chip key={r} selected={radiusParam === r} onClick={() => update({ radius: String(r) })}>{r} km</Chip>)}
          </div>
        ) : (
          <p className="mt-2 text-[15px] text-muted-foreground">Choose an area, or <button onClick={loc.openSheet} className="font-medium text-foreground underline underline-offset-4">set your location</button>, to filter by distance.</p>
        )}
      </fieldset>
      <fieldset>
        <legend className="text-[15px] font-semibold">Rating</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {[0, 4, 4.5].map((r) => <Chip key={r} selected={ratingMin === r} onClick={() => update({ rating: r ? String(r) : null })}>{r ? `${r}+` : "Any"}</Chip>)}
        </div>
      </fieldset>
      {priceBounds && priceBounds.max > priceBounds.min && (
        <fieldset>
          <legend className="text-[15px] font-semibold">From price per visit</legend>
          <p className="mt-1 text-small text-muted-foreground" aria-live="polite">{kes(priceDraft?.[0] ?? priceLo)} to {kes(priceDraft?.[1] ?? priceHi)}</p>
          <div className="mt-2 space-y-2">
            <label className="block text-small">Minimum<input type="range" className="mt-1 w-full accent-[hsl(var(--primary))]" min={priceBounds.min} max={priceBounds.max} step={100} value={priceDraft?.[0] ?? priceLo}
              onChange={(e) => setPriceDraft([Math.min(Number(e.target.value), priceDraft?.[1] ?? priceHi), priceDraft?.[1] ?? priceHi])} /></label>
            <label className="block text-small">Maximum<input type="range" className="mt-1 w-full accent-[hsl(var(--primary))]" min={priceBounds.min} max={priceBounds.max} step={100} value={priceDraft?.[1] ?? priceHi}
              onChange={(e) => setPriceDraft([priceDraft?.[0] ?? priceLo, Math.max(Number(e.target.value), priceDraft?.[0] ?? priceLo)])} /></label>
          </div>
        </fieldset>
      )}
      <fieldset>
        <legend className="text-[15px] font-semibold">Availability</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          <Chip selected={!avail} onClick={() => update({ avail: null })}>Any</Chip>
          <Chip selected={avail === "today"} onClick={() => update({ avail: "today" })}>Today</Chip>
          <Chip selected={avail === "week"} onClick={() => update({ avail: "week" })}>This week</Chip>
        </div>
      </fieldset>
      {languages.length > 0 && (
        <fieldset>
          <legend className="text-[15px] font-semibold">Language</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            <Chip selected={!lang} onClick={() => update({ lang: null })}>Any</Chip>
            {languages.map((l) => <Chip key={l} selected={lang === l} onClick={() => update({ lang: l })}>{l}</Chip>)}
          </div>
        </fieldset>
      )}
    </div>
  );

  const sortSelect = (
    <label className="flex items-center gap-2 text-[15px]">
      <span className="text-muted-foreground">Sort</span>
      <select value={sort} onChange={(e) => update({ sort: e.target.value })} className="h-11 rounded-lg border border-border-strong bg-card px-3 text-[15px] font-medium">
        {SORTS.map((s) => <option key={s.value} value={s.value} disabled={s.value === "nearest" && !ref}>{s.label}</option>)}
      </select>
    </label>
  );

  return (
    <div className="lg:grid lg:grid-cols-[17rem_1fr] lg:gap-10">
      <aside className="hidden lg:block" aria-label="Filters">
        <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
          <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold">Filters</h2>{activeChips.length > 0 && <button onClick={clearAll} className="min-h-11 text-[15px] font-medium underline underline-offset-4">Clear all</button>}</div>
          {panel}
        </div>
      </aside>

      <div>
        <div className="sticky top-16 z-30 -mx-5 flex items-center gap-3 border-b border-border bg-background/95 px-5 py-3 backdrop-blur sm:-mx-8 sm:px-8 lg:hidden">
          <Button variant="secondary" onClick={() => setSheet(true)}><SlidersHorizontal className="h-4 w-4" aria-hidden /> Filters{activeChips.length > 0 && ` (${activeChips.length})`}</Button>
          <div className="ml-auto">{sortSelect}</div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-6 lg:pt-0">
          <h2 className="text-h3" aria-live="polite" aria-atomic="true">{heading}</h2>
          <div className="hidden lg:block">{sortSelect}</div>
        </div>

        <div className="mt-4">
          <label className="sr-only" htmlFor="browse-q">Search by name, trade or qualification</label>
          <input id="browse-q" type="search" value={qDraft} onChange={(e) => setQDraft(e.target.value)} placeholder="Search by name, trade or qualification"
            className="h-12 w-full rounded-lg border border-border-strong bg-card px-4 text-base" />
        </div>

        {activeChips.length > 0 && (
          <ul className="mt-4 flex flex-wrap items-center gap-2" aria-label="Active filters">
            {activeChips.map((c) => (
              <li key={c.label}><button onClick={() => update(c.clear)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-primary bg-primary/[0.08] px-3 text-[15px] font-medium">{c.label}<X className="h-4 w-4" aria-label="Remove filter" /></button></li>
            ))}
            <li><button onClick={clearAll} className="min-h-10 px-2 text-[15px] font-medium underline underline-offset-4">Clear all</button></li>
          </ul>
        )}
        {!ref && (
          <p className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-muted px-4 py-3 text-[15px]">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden /> Showing top-rated first.
            <button onClick={loc.openSheet} className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4">Show pros closest to you</button>
          </p>
        )}

        <div className={cn("mt-6 transition-opacity duration-150", (pending || qDraft !== q) && "opacity-60")} aria-busy={pending}>
          {rows.length > 0 ? (
            <>
              <ProGrid className="lg:grid-cols-2 xl:grid-cols-3">
                {rows.slice(0, shown).map(({ p, km }) => <ProCard key={p.ref} pro={p} km={ref ? km : null} />)}
              </ProGrid>
              <div ref={sentinel} aria-hidden className="h-px" />
              <p className="mt-6 text-center text-[15px] text-muted-foreground" aria-live="polite">Showing {Math.min(shown, rows.length)} of {rows.length}</p>
              {shown < rows.length && <div className="mt-3 flex justify-center"><Button variant="secondary" onClick={() => setShown((n) => n + PAGE)}>Load more</Button></div>}
            </>
          ) : (
            <div className="rounded-card border border-dashed border-border-strong px-6 py-14 text-center" role="status">
              <h3 className="text-h3">No {trade === "professional" ? "professionals" : `${trade} pros`}{radiusParam ? ` within ${radiusParam} km` : " match these filters"}.</h3>
              <p className="mx-auto mt-2 max-w-md text-base text-muted-foreground">Try widening your search, or message us and we will arrange one for you.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {radiusParam > 0 && nextRadius && <Button variant="primary" onClick={() => update({ radius: String(nextRadius) })}>Expand to {nextRadius} km</Button>}
                {activeChips.length > 0 && <Button variant="secondary" onClick={clearAll}>Clear filters</Button>}
                {settings.adminPhone && <ButtonLink href={wa} external variant="accent"><MessageCircle className="h-4 w-4" aria-hidden /> Message us</ButtonLink>}
              </div>
            </div>
          )}
        </div>
      </div>

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Filters" className="sm:max-w-md"
        footer={<div className="flex gap-3"><Button variant="secondary" className="flex-1" onClick={clearAll}>Clear</Button><Button variant="primary" className="flex-1" onClick={() => setSheet(false)}>Show {rows.length} {rows.length === 1 ? "pro" : "pros"}</Button></div>}>
        {panel}
      </Sheet>
    </div>
  );
}

