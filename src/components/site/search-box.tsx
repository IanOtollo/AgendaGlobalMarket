"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, MapPin, Search, User, Wrench } from "lucide-react";
import { AREA_LIST } from "@/lib/areas";
import { iconOf } from "@/lib/trades";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ds/button";
import { useLocation, useSiteData, useTrades } from "./providers";

type Opt = { id: string; group: "Recent" | "Services" | "Professionals" | "Areas"; label: string; sub?: string; href: string; icon: typeof Search };
const RECENT_KEY = "agm-recent-searches";
const readRecent = (): string[] => { try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"); } catch { return []; } };
const pushRecent = (q: string) => { try { localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...readRecent().filter((x) => x !== q)].slice(0, 5))); } catch {} };

/** Autocomplete across trades, professionals and areas, with recent searches. `hero` adds the location segment and button. */
export function SearchBox({ variant = "hero", className }: { variant?: "hero" | "compact"; className?: string }) {
  const router = useRouter();
  const { pros } = useSiteData();
  const CATEGORY_LIST = useTrades();
  const loc = useLocation();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);
  const box = useRef<HTMLDivElement>(null);
  const uid = useId();

  useEffect(() => setRecent(readRecent()), [open]);
  useEffect(() => {
    const down = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", down);
    return () => document.removeEventListener("mousedown", down);
  }, []);

  const options = useMemo<Opt[]>(() => {
    const t = q.trim().toLowerCase();
    if (!t) {
      return [
        ...recent.map((r, i): Opt => ({ id: `r${i}`, group: "Recent", label: r, href: `/services?q=${encodeURIComponent(r)}`, icon: Clock })),
        ...CATEGORY_LIST.slice(0, 5).map((c): Opt => ({ id: `c-${c.slug}`, group: "Services", label: c.name, href: `/services/${c.slug}`, icon: iconOf(c.icon) })),
      ];
    }
    return [
      ...CATEGORY_LIST.filter((c) => c.name.toLowerCase().includes(t)).map((c): Opt => ({ id: `c-${c.slug}`, group: "Services", label: c.name, sub: c.blurb, href: `/services/${c.slug}`, icon: iconOf(c.icon) })),
      ...pros.filter((p) => [p.name, p.category, ...p.qualifications].some((s) => s.toLowerCase().includes(t))).slice(0, 5)
        .map((p): Opt => ({ id: `p-${p.slug}`, group: "Professionals", label: p.name, sub: `${p.category} · ${p.area}`, href: `/pros/${p.slug}`, icon: User })),
      ...AREA_LIST.filter((a) => a.name.toLowerCase().includes(t)).slice(0, 3).map((a): Opt => ({ id: `a-${a.slug}`, group: "Areas", label: a.name, sub: "Browse professionals in this area", href: `/services?area=${a.slug}`, icon: MapPin })),
    ];
  }, [q, recent, pros]);

  const go = (href: string, label?: string) => {
    setOpen(false); setActive(-1);
    if (label) pushRecent(label);
    track("search_submitted", { query: label ?? q });
    router.push(href);
  };
  const submit = () => {
    if (active >= 0 && options[active]) return go(options[active].href, options[active].group === "Recent" || options[active].group === "Services" || options[active].group === "Professionals" ? options[active].label : undefined);
    const t = q.trim();
    if (t) go(`/services?q=${encodeURIComponent(t)}`, t);
    else go("/services");
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, options.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, -1)); }
    else if (e.key === "Enter") { e.preventDefault(); submit(); }
    else if (e.key === "Escape") setOpen(false);
  };

  const hero = variant === "hero";
  let last = "";
  return (
    <div ref={box} className={cn("relative", className)}>
      <div role="search" className={cn("flex items-stretch bg-card", hero ? "flex-col rounded-card border border-border-strong shadow-hover sm:flex-row sm:items-center" : "rounded-lg border border-border-strong")}>
        <div className="relative flex min-w-0 flex-1 items-center">
          <Search className="pointer-events-none absolute left-4 h-5 w-5 text-muted-foreground" aria-hidden />
          <input
            role="combobox" aria-expanded={open} aria-controls={`${uid}-list`} aria-autocomplete="list" aria-activedescendant={active >= 0 ? `${uid}-${active}` : undefined}
            aria-label="What do you need?" value={q} placeholder={hero ? "What do you need? Plumbing, electrician…" : "Search trades or professionals"} autoComplete="off"
            onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(-1); }} onFocus={() => setOpen(true)} onKeyDown={onKey}
            className={cn("w-full min-w-0 bg-transparent pl-12 pr-3 text-base placeholder:text-muted-foreground", hero ? "h-14" : "h-11 text-[15px]")}
          />
        </div>
        {hero && (
          <>
            <span className="hidden h-8 w-px bg-border sm:block" aria-hidden />
            <button type="button" onClick={loc.openSheet} className="flex h-12 items-center gap-2 border-t border-border px-4 text-left text-[15px] hover:bg-muted sm:h-14 sm:min-w-[11rem] sm:border-t-0">
              <MapPin className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
              <span className="truncate font-medium">{loc.hasLocation && loc.area ? loc.area.name : loc.state === "prompting" ? "Locating…" : "Use my location"}</span>
            </button>
            <div className="p-2"><Button variant="accent" size="lg" block className="sm:w-auto" onClick={submit}>Find pros</Button></div>
          </>
        )}
      </div>

      {open && options.length > 0 && (
        <ul id={`${uid}-list`} role="listbox" aria-label="Suggestions" className="absolute inset-x-0 top-full z-40 mt-2 max-h-80 overflow-y-auto rounded-card border border-border bg-card p-2 shadow-hover">
          {options.map((o, i) => {
            const header = o.group !== last; last = o.group;
            const Icon = o.icon;
            return (
              <li key={o.id} role="presentation">
                {header && <p className="px-3 pb-1 pt-2 text-micro font-semibold uppercase tracking-wide text-muted-foreground">{o.group}</p>}
                <button id={`${uid}-${i}`} role="option" aria-selected={i === active} onMouseEnter={() => setActive(i)} onMouseDown={(e) => e.preventDefault()}
                  onClick={() => go(o.href, o.group === "Areas" ? undefined : o.label)}
                  className={cn("flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left", i === active && "bg-muted")}>
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="min-w-0"><span className="block truncate text-[15px] font-medium">{o.label}</span>{o.sub && <span className="block truncate text-small text-muted-foreground">{o.sub}</span>}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
