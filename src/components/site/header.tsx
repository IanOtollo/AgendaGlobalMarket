"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Loader2, Menu, MapPin } from "lucide-react";
import { iconOf } from "@/lib/trades";
import { AREA_BY_SLUG } from "@/lib/areas";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ds/button";
import { Sheet } from "@/components/ds/sheet";
import { Container } from "@/components/ds/primitives";
import { BRAND } from "@/lib/config";
import { useLocation, useSiteData, useSiteUi, useTrades } from "./providers";
import { SearchBox } from "./search-box";
import { LocationSheet } from "./location-sheet";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      {/* The emblem from the logo (transparent, in the right colours for light or dark), with the name set beside it:
          the full lockup is too tall for a slim header. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo-mark.png" alt="" width={240} height={259} className="logo-on-light h-11 w-auto" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo-mark-dark.png" alt="" width={240} height={259} className="logo-on-dark h-11 w-auto" />
      <span aria-hidden className="hidden leading-none text-foreground sm:block">
        <span className="block text-[17px] font-bold tracking-wide">ONE AGENDA</span>
        <span className="mt-1 block text-[10px] font-medium tracking-[0.3em]">GLOBAL MARKET</span>
      </span>
      <span className="sr-only">{BRAND.name}</span>
    </span>
  );
}

function LocationChip() {
  const loc = useLocation();
  const label = loc.state === "prompting" ? "Locating…" : loc.hasLocation && loc.area ? loc.area.name : loc.state === "denied" || loc.state === "unavailable" ? "Choose area" : "Set location";
  return (
    <button onClick={loc.openSheet} aria-label={`Location: ${label}. Change location`}
      className="flex min-h-11 max-w-[9.5rem] items-center gap-1.5 rounded-lg border border-border-strong bg-card px-3 text-[15px] font-medium hover:bg-muted sm:max-w-[12rem]">
      {loc.state === "prompting" ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden /> : <MapPin className="h-4 w-4 shrink-0" aria-hidden />}
      <span className="truncate">{label}</span>
      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
    </button>
  );
}

export function SiteHeader() {
  const path = usePathname();
  const { pros } = useSiteData();
  const CATEGORY_LIST = useTrades();
  const { heroSearchVisible } = useSiteUi();
  const [scrolled, setScrolled] = useState(false);
  const [mega, setMega] = useState(false);
  const [menu, setMenu] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => { setMega(false); setMenu(false); }, [path]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on(); window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    if (!mega) return;
    const down = (e: MouseEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) setMega(false); };
    const key = (e: KeyboardEvent) => e.key === "Escape" && setMega(false);
    document.addEventListener("mousedown", down); document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", down); document.removeEventListener("keydown", key); };
  }, [mega]);

  const counts = useMemo(() => Object.fromEntries(CATEGORY_LIST.map((c) => [c.name, pros.filter((p) => p.category === c.name).length])), [pros]);
  const topAreas = useMemo(() => {
    const m = new Map<string, number>();
    pros.forEach((p) => m.set(p.areaSlug, (m.get(p.areaSlug) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([slug, n]) => ({ slug, n, name: AREA_BY_SLUG[slug]?.name ?? slug }));
  }, [pros]);

  const navLink = "flex min-h-11 items-center rounded-lg px-3 text-[15px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground";

  return (
    <>
      <header className={cn("sticky top-0 z-50 border-b print:hidden transition-colors duration-240 ease-ui", scrolled ? "border-border bg-background/85 backdrop-blur-md" : "border-transparent bg-background")}>
        <Container className="flex h-16 items-center gap-3">
          <Link href="/" aria-label={`${BRAND.name} home`} className="min-w-0 shrink-0"><BrandMark /></Link>

          <nav aria-label="Main" className="ml-4 hidden items-center gap-1 lg:flex">
            <div ref={wrap} className="relative">
              <button aria-expanded={mega} aria-haspopup="true" onClick={() => setMega((m) => !m)} className={cn(navLink, "gap-1", mega && "bg-muted text-foreground")}>
                Services <ChevronDown className={cn("h-4 w-4 transition-transform duration-150", mega && "rotate-180")} aria-hidden />
              </button>
              {mega && (
                <div className="absolute left-0 top-full mt-2 w-[44rem] rounded-card border border-border bg-card p-6 shadow-hover">
                  <div className="grid grid-cols-[1.6fr_1fr] gap-8">
                    <div className="grid grid-cols-2 gap-1">
                      {CATEGORY_LIST.map((c) => {
                        const Icon = iconOf(c.icon);
                        return (
                          <Link key={c.slug} href={`/services/${c.slug}`} className="flex gap-3 rounded-lg p-3 hover:bg-muted">
                            <Icon className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.5} aria-hidden />
                            <span><span className="block text-[15px] font-semibold">{c.name}</span><span className="block text-small text-muted-foreground">{counts[c.name]} {counts[c.name] === 1 ? "professional" : "professionals"}</span></span>
                          </Link>
                        );
                      })}
                      <Link href="/services" className="flex min-h-11 items-center rounded-lg p-3 text-[15px] font-semibold underline underline-offset-4 hover:bg-muted">All services</Link>
                    </div>
                    <div className="border-l border-border pl-8">
                      <p className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">Browse by area</p>
                      <ul className="mt-2">
                        {topAreas.map((a) => (
                          <li key={a.slug}><Link href={`/services?area=${a.slug}`} className="flex min-h-11 items-center justify-between rounded-lg px-2 text-[15px] hover:bg-muted"><span>{a.name}</span><span className="text-small text-muted-foreground">{a.n}</span></Link></li>
                        ))}
                        {topAreas.length === 0 && <li className="py-2 text-[15px] text-muted-foreground">Areas appear as professionals are added.</li>}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Link href="/how-it-works" className={navLink}>How it works</Link>
            <Link href="/become-a-pro" className={navLink}>For pros</Link>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <div className={cn("hidden w-72 transition-all duration-240 ease-ui xl:block", heroSearchVisible ? "pointer-events-none translate-y-1 opacity-0" : "translate-y-0 opacity-100")} aria-hidden={heroSearchVisible}>
              <SearchBox variant="compact" />
            </div>
            <LocationChip />
            <ButtonLink href="/services" variant="primary" className="hidden lg:inline-flex">Book a pro</ButtonLink>
            <button onClick={() => setMenu(true)} aria-label="Open menu" className="flex h-11 w-11 items-center justify-center rounded-lg border border-border-strong lg:hidden"><Menu className="h-5 w-5" /></button>
          </div>
        </Container>
      </header>

      <Sheet open={menu} onClose={() => setMenu(false)} title="Menu">
        <div className="space-y-6">
          <SearchBox variant="compact" />
          <nav aria-label="Mobile">
            <p className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">Services</p>
            <ul className="mt-1">
              {CATEGORY_LIST.map((c) => <li key={c.slug}><Link href={`/services/${c.slug}`} className="flex min-h-12 items-center justify-between border-b border-border text-base font-medium">{c.name}<span className="text-small text-muted-foreground">{counts[c.name]}</span></Link></li>)}
              <li><Link href="/services" className="flex min-h-12 items-center border-b border-border text-base font-semibold">All services</Link></li>
            </ul>
            <ul className="mt-4">
              {[["How it works", "/how-it-works"], ["For pros", "/become-a-pro"], ["Trust and safety", "/trust-and-safety"], ["About", "/about"], ["Contact", "/contact"], ["Help centre", "/help"]].map(([l, h]) => (
                <li key={h}><Link href={h} className="flex min-h-12 items-center border-b border-border text-base">{l}</Link></li>
              ))}
            </ul>
          </nav>
        </div>
      </Sheet>
      <LocationSheet />
    </>
  );
}
