"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { AREA_LIST } from "@/lib/areas";
import { cn } from "@/lib/utils";
import { useLocation, useSiteData } from "./providers";

// A real map of Nairobi (OpenStreetMap data, served as free vector tiles by OpenFreeMap, no API key). Our curated
// areas sit on it as pins; a pin turns yellow when a professional is based there. Loaded only on large screens.
const BOUNDS: [[number, number], [number, number]] = [[36.69, -1.335], [36.94, -1.175]];
const STYLE = "https://tiles.openfreemap.org/styles/positron";
const pinClass = (major: boolean, has: boolean, active: boolean) =>
  cn("block rounded-full border-2 shadow-sm transition-transform duration-200 group-hover:scale-125 group-focus-visible:scale-125 group-focus-visible:ring-2 group-focus-visible:ring-[#101F42]",
    major ? "h-5 w-5" : "h-3.5 w-3.5", has ? "border-[#101F42] bg-[#FFC105]" : "border-[#101F42]/60 bg-white", active && "ring-2 ring-[#101F42] ring-offset-2");

export function HeroMap() {
  const { pros } = useSiteData();
  const loc = useLocation();
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const pins = useRef<Map<string, { el: HTMLButtonElement; marker: Marker }>>(new Map());
  const userMoved = useRef(false);
  const cleanups = useRef<(() => void)[]>([]);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const chooseRef = useRef(loc.chooseArea);
  chooseRef.current = loc.chooseArea;

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    pros.forEach((p) => m.set(p.area, (m.get(p.area) ?? 0) + 1));
    return m;
  }, [pros]);

  // Create the map once, on large screens only.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    let cancelled = false;
    const start = async () => {
      if (map.current || cancelled || !host.current || !mq.matches) return;
      try {
        const maplibre = await import("maplibre-gl");
        maplibre.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
        if (cancelled || !host.current || map.current) return;
        const m = new maplibre.Map({
          container: host.current, style: STYLE, attributionControl: { compact: true }, cooperativeGestures: true,
          bounds: BOUNDS, fitBoundsOptions: { padding: 28 }, maxBounds: [[36.4, -1.6], [37.2, -0.95]], minZoom: 9, dragRotate: false,
        });
        m.addControl(new maplibre.NavigationControl({ showCompass: false }), "bottom-right");
        m.touchZoomRotate.disableRotation();
        const fit = () => { m.resize(); m.fitBounds(BOUNDS, { padding: 28, animate: false }); };
        m.on("load", () => { fit(); setReady(true); });
        // The stylesheet can arrive after the canvas is created: refit whenever the box changes size.
        const ro = new ResizeObserver(() => { m.resize(); if (!m.isMoving() && !userMoved.current) m.fitBounds(BOUNDS, { padding: 28, animate: false }); });
        ro.observe(host.current);
        m.on("dragstart", () => { userMoved.current = true; }); m.on("zoomstart", (e: unknown) => { if ((e as { originalEvent?: unknown }).originalEvent) userMoved.current = true; });
        cleanups.current.push(() => ro.disconnect());
        m.on("error", (e) => { console.error("map error", (e as unknown as { error?: Error }).error?.message); if (!m.loaded() && !(e as unknown as { sourceId?: string }).sourceId) setFailed(true); });
        for (const a of AREA_LIST) {
          const el = document.createElement("button");
          el.type = "button";
          // MapLibre positions the marker element itself, so the look lives on an inner span (and the button adds a roomy tap target).
          el.className = "group p-1.5 focus-visible:outline-none";
          el.appendChild(document.createElement("span"));
          el.addEventListener("click", () => { chooseRef.current(a.slug); m.flyTo({ center: [a.lng, a.lat], zoom: Math.max(m.getZoom(), 12.5), essential: false }); });
          el.addEventListener("mouseenter", () => setHover(a.name));
          el.addEventListener("mouseleave", () => setHover(null));
          el.addEventListener("focus", () => setHover(a.name));
          el.addEventListener("blur", () => setHover(null));
          const marker = new maplibre.Marker({ element: el }).setLngLat([a.lng, a.lat]).addTo(m);
          pins.current.set(a.slug, { el, marker });
        }
        map.current = m;
      } catch (err) { console.error("map init failed", err); setFailed(true); }
    };
    void start();
    mq.addEventListener("change", start);
    return () => {
      cancelled = true;
      mq.removeEventListener("change", start);
      cleanups.current.forEach((c) => c()); cleanups.current = [];
      map.current?.remove(); map.current = null; pins.current.clear();
    };
  }, []);

  // Keep the pins in step with live data and the chosen area.
  useEffect(() => {
    for (const a of AREA_LIST) {
      const p = pins.current.get(a.slug);
      if (!p) continue;
      const n = counts.get(a.name) ?? 0;
      (p.el.firstElementChild as HTMLElement).className = pinClass(a.name === "CBD", n > 0, loc.area?.slug === a.slug);
      p.el.setAttribute("aria-label", `${a.name}: ${n} ${n === 1 ? "professional" : "professionals"} listed. Set as my area.`);
      p.el.setAttribute("aria-pressed", String(loc.area?.slug === a.slug));
    }
  }, [counts, loc.area, ready]);

  const shown = AREA_LIST.find((a) => a.name === (hover ?? loc.area?.name));
  const n = shown ? counts.get(shown.name) ?? 0 : 0;

  return (
    <div className="hidden w-full max-w-[26rem] lg:block">
      <div className="relative aspect-[5/4] overflow-hidden rounded-3xl bg-muted shadow-hover ring-1 ring-border">
        <div className="absolute inset-0"><div ref={host} className="h-full w-full" role="region" aria-label="Map of Nairobi with the areas we list professionals in" /></div>
        {failed && <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">The map could not load. Use the search above to choose your area.</p>}
        <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-lg bg-white/95 px-3 py-2 text-[#101F42] shadow-hover" aria-live="polite">
          <p className="text-sm font-semibold leading-tight">{shown ? shown.name : "Nairobi"}</p>
          <p className="text-xs text-[#4B5563]">{shown ? (n ? `${n} ${n === 1 ? "professional" : "professionals"} based here` : "No professionals based here yet") : "Tap an area to set yours"}</p>
        </div>
      </div>
      <ul className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground" aria-label="Map key">
        <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border-2 border-foreground/70 bg-brand" />Professionals based here</li>
        <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border-2 border-foreground/50 bg-white" />None yet</li>
      </ul>
    </div>
  );
}
