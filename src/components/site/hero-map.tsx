"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { AREA_LIST } from "@/lib/areas";
import { NAIROBI_OUTLINE } from "@/lib/nairobi-outline";
import { cn } from "@/lib/utils";
import { useLocation, useSiteData } from "./providers";

// Our own map of Nairobi: the real county boundary (OpenStreetMap, saved in the project, no map service involved)
// in the brand colours. Every professional gets a pin where the admin placed them (or at the centre of their base
// area), rounded to about 1 km on the server. The small dots are the areas people can choose.
const W = 600, H = 420, PAD = 26;
const LABELLED = ["CBD", "Westlands", "Karen", "Kasarani", "Embakasi", "Ruaka", "Kahawa", "Ongata Rongai", "Syokimau", "Langata", "Donholm"];

// Everything that depends on where the areas are: the scale, the boundary path and the grid. Recomputed when areas are added.
function makeGeo() {
  const allLng = [...NAIROBI_OUTLINE.map((p) => p[0]), ...AREA_LIST.map((a) => a.lng)];
  const allLat = [...NAIROBI_OUTLINE.map((p) => p[1]), ...AREA_LIST.map((a) => a.lat)];
  const [minLng, maxLng, minLat, maxLat] = [Math.min(...allLng), Math.max(...allLng), Math.min(...allLat), Math.max(...allLat)];
  const cosLat = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const S = Math.min((W - PAD * 2) / ((maxLng - minLng) * cosLat), (H - PAD * 2) / (maxLat - minLat));
  const ox = (W - (maxLng - minLng) * cosLat * S) / 2, oy = (H - (maxLat - minLat) * S) / 2;
  const project = (lng: number, lat: number) => ({ x: ox + (lng - minLng) * cosLat * S, y: oy + (maxLat - lat) * S });
  const outline = `M${NAIROBI_OUTLINE.map(([lng, lat]) => { const p = project(lng, lat); return `${p.x.toFixed(1)} ${p.y.toFixed(1)}`; }).join("L")}Z`;
  const v: number[] = [], h: number[] = [];
  for (let lng = Math.ceil(minLng * 20) / 20; lng <= maxLng; lng += 0.05) v.push(project(lng, 0).x);
  for (let lat = Math.ceil(minLat * 20) / 20; lat <= maxLat; lat += 0.05) h.push(project(0, lat).y);
  return { project, outline, grid: { v, h }, cbd: AREA_LIST.find((a) => a.name === "CBD") };
}

export function HeroMap() {
  const { pros, settings } = useSiteData();
  const areaKey = JSON.stringify(settings.areas);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const geo = useMemo(() => makeGeo(), [areaKey]);
  const loc = useLocation();
  const reduce = useReducedMotion();
  const [hover, setHover] = useState<{ kind: "pro"; ref: string } | { kind: "area"; slug: string } | null>(null);

  // One pin per professional. Pins that land on the same spot fan out in a small ring so none is hidden.
  const pins = useMemo(() => {
    const groups = new Map<string, typeof pros>();
    pros.forEach((p) => { const k = `${p.lat.toFixed(3)},${p.lng.toFixed(3)}`; groups.set(k, [...(groups.get(k) ?? []), p]); });
    return [...groups.values()].flatMap((g) => g.map((p, i) => {
      const base = geo.project(p.lng, p.lat);
      const a = (i / g.length) * Math.PI * 2 - Math.PI / 2, r = g.length > 1 ? 11 + g.length * 1.5 : 0;
      return { p, x: base.x + Math.cos(a) * r, y: base.y + Math.sin(a) * r };
    }));
  }, [pros]);
  const origin = geo.cbd ? geo.project(geo.cbd.lng, geo.cbd.lat) : { x: W / 2, y: H / 2 };
  const hoveredPro = hover?.kind === "pro" ? pros.find((p) => p.ref === hover.ref) : undefined;
  const hoveredArea = hover?.kind === "area" ? AREA_LIST.find((a) => a.slug === hover.slug) : undefined;
  const areaName = hoveredArea?.name ?? loc.area?.name;
  const areaCount = areaName ? pros.filter((p) => p.area === areaName).length : 0;

  return (
    <div className="w-full md:max-w-[28rem]">
      <div className="relative aspect-[10/7] overflow-hidden rounded-3xl bg-[#0B1530] shadow-hover ring-1 ring-white/10" onMouseLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" aria-hidden>
          <g stroke="#1E3469" strokeWidth="1" opacity=".45">
            {geo.grid.v.map((x) => <line key={`v${x}`} x1={x} y1="0" x2={x} y2={H} />)}
            {geo.grid.h.map((y) => <line key={`h${y}`} x1="0" y1={y} x2={W} y2={y} />)}
          </g>
          <motion.path d={geo.outline} fill="#17294F" stroke="#5C7FC9" strokeWidth="1.6" strokeLinejoin="round"
            initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9, ease: "easeOut" }} />
          <text x={W - PAD} y={H - 10} textAnchor="end" fill="#8E9BB8" fontSize="11" letterSpacing="2">NAIROBI COUNTY</text>
        </svg>

        {AREA_LIST.map((a) => {
          const p = geo.project(a.lng, a.lat);
          const on = loc.area?.slug === a.slug;
          const label = LABELLED.includes(a.name);
          return (
            <motion.button key={a.slug} type="button" onClick={() => loc.chooseArea(a.slug)} onMouseEnter={() => setHover({ kind: "area", slug: a.slug })} onFocus={() => setHover({ kind: "area", slug: a.slug })} onBlur={() => setHover(null)}
              aria-label={`${a.name}. Set as my area.`} aria-pressed={on}
              initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 + Math.hypot(p.x - origin.x, p.y - origin.y) / 400, duration: 0.4 }}
              className="group absolute z-10 -translate-x-1/2 -translate-y-1/2 p-2 focus-visible:outline-none" style={{ left: `${(p.x / W) * 100}%`, top: `${(p.y / H) * 100}%` }}>
              <span className={cn("block h-2 w-2 rounded-full bg-[#8E9BB8] transition-transform group-hover:scale-150 group-focus-visible:scale-150 group-focus-visible:ring-2 group-focus-visible:ring-white", on && "scale-150 bg-white ring-2 ring-white/60")} />
              {label && <span className="pointer-events-none absolute left-full top-1/2 ml-0.5 hidden -translate-y-1/2 whitespace-nowrap text-[10px] sm:block font-medium text-[#C5CAD3]">{a.name}</span>}
            </motion.button>
          );
        })}

        {pins.map(({ p, x, y }, i) => (
          <motion.div key={p.ref} className="absolute z-20" style={{ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` }}
            initial={reduce ? false : { opacity: 0, y: -14, scale: 0.6 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 1.2 + i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
            <Link href={`/pros/${p.slug}`} aria-label={`${p.name}, ${p.category}, based in ${p.area}`} onMouseEnter={() => setHover({ kind: "pro", ref: p.ref })} onFocus={() => setHover({ kind: "pro", ref: p.ref })} onBlur={() => setHover(null)}
              className="group absolute -translate-x-1/2 -translate-y-full p-1 focus-visible:outline-none">
              <svg viewBox="0 0 24 32" className="h-8 w-6 drop-shadow transition-transform group-hover:-translate-y-0.5 group-hover:scale-110 group-focus-visible:scale-110" aria-hidden>
                <path d="M12 31C12 31 2 19.5 2 12.5a10 10 0 0 1 20 0C22 19.5 12 31 12 31Z" fill="#FFC105" stroke="#0B1530" strokeWidth="2" />
                <circle cx="12" cy="12.5" r="3.6" fill="#0B1530" />
              </svg>
            </Link>
          </motion.div>
        ))}

        <div className="pointer-events-none absolute left-2 top-2 z-30 max-w-[75%] sm:left-3 sm:top-3 rounded-lg bg-white/95 px-3 py-2 text-[#101F42] shadow-hover" aria-live="polite">
          {hoveredPro ? (
            <><p className="truncate text-sm font-semibold leading-tight">{hoveredPro.name}</p><p className="text-xs text-[#4B5563]">{hoveredPro.category} · {hoveredPro.area}</p></>
          ) : (
            <><p className="text-sm font-semibold leading-tight">{areaName ?? "Nairobi"}</p>
              <p className="text-xs text-[#4B5563]">{areaName ? (areaCount ? `${areaCount} ${areaCount === 1 ? "professional" : "professionals"} based here` : "No professionals based here yet") : pros.length ? `${pros.length} ${pros.length === 1 ? "professional" : "professionals"} on the map` : "Tap an area to set yours"}</p></>
          )}
        </div>
      </div>
      <ul className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground" aria-label="Map key">
        <li className="flex items-center gap-1.5"><svg viewBox="0 0 24 32" className="h-4 w-3" aria-hidden><path d="M12 31C12 31 2 19.5 2 12.5a10 10 0 0 1 20 0C22 19.5 12 31 12 31Z" fill="#FFC105" stroke="currentColor" strokeWidth="2.4" /></svg>A professional (tap for their profile)</li>
        <li className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#8E9BB8]" />Areas you can choose</li>
      </ul>
    </div>
  );
}
