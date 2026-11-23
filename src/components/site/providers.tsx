"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AREA_BY_SLUG, type Area } from "@/lib/areas";
import { DEFAULT_RADIUS, clearLocation, loadLocation, nearestArea, round3, saveLocation, type LocState } from "@/lib/location";
import { track } from "@/lib/analytics";
import type { PublicPro, PublicSettings } from "@/lib/types";

/* ---------- Live public data (server-rendered first, then kept fresh by the public stream) ---------- */
type SiteData = { pros: PublicPro[]; settings: PublicSettings };
const DataCtx = createContext<SiteData | null>(null);
export const useSiteData = () => {
  const c = useContext(DataCtx);
  if (!c) throw new Error("SiteProviders missing");
  return c;
};

/* ---------- Location ---------- */
type Loc = {
  state: LocState; coords: { lat: number; lng: number } | null; area: Area | null; radius: number; recent: Area[];
  hasLocation: boolean; sheetOpen: boolean;
  openSheet: () => void; closeSheet: () => void;
  requestGps: () => void; chooseArea: (slug: string) => void; setRadius: (km: number) => void; clear: () => void;
};
const LocCtx = createContext<Loc | null>(null);
export const useLocation = () => {
  const c = useContext(LocCtx);
  if (!c) throw new Error("SiteProviders missing");
  return c;
};

/* ---------- Header search visibility (the hero search hands over to a compact one in the header) ---------- */
const UiCtx = createContext<{ heroSearchVisible: boolean; setHeroSearchVisible: (v: boolean) => void } | null>(null);
export const useSiteUi = () => {
  const c = useContext(UiCtx);
  if (!c) throw new Error("SiteProviders missing");
  return c;
};

export function SiteProviders({ pros, settings, children }: SiteData & { children: ReactNode }) {
  const [data, setData] = useState<SiteData>({ pros, settings });
  const [state, setState] = useState<LocState>("unknown");
  const [coords, setCoords] = useState<Loc["coords"]>(null);
  const [area, setArea] = useState<Area | null>(null);
  const [radius, setRadiusState] = useState(DEFAULT_RADIUS);
  const [recent, setRecent] = useState<string[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [heroSearchVisible, setHeroSearchVisible] = useState(false);
  const watchdog = useRef<ReturnType<typeof setTimeout>>();

  // Live updates: the public stream carries only the public model.
  useEffect(() => {
    const es = new EventSource("/api/public/stream");
    es.onmessage = (e) => { try { setData(JSON.parse(e.data)); } catch {} };
    return () => es.close();
  }, []);

  const persist = useCallback((c: { lat: number; lng: number }, slug: string, source: "gps" | "manual", r: number, rec: string[]) => {
    saveLocation({ lat: round3(c.lat), lng: round3(c.lng), areaSlug: slug, source, radius: r, recent: rec });
  }, []);

  const applyGps = useCallback((lat: number, lng: number, r: number, rec: string[]) => {
    const c = { lat: round3(lat), lng: round3(lng) };
    const near = nearestArea(c.lat, c.lng).area;
    setCoords(c); setArea(near); setState("granted");
    persist(c, near.slug, "gps", r, rec);
  }, [persist]);

  // On load: restore a saved choice. If the browser already granted permission, locate silently (no prompt).
  // Never calls the geolocation API for a user who has not been asked.
  useEffect(() => {
    const saved = loadLocation();
    if (saved) {
      setRadiusState(saved.radius); setRecent(saved.recent);
      setCoords({ lat: saved.lat, lng: saved.lng }); setArea(AREA_BY_SLUG[saved.areaSlug]);
      setState(saved.source === "gps" ? "granted" : "manual");
    }
    if (!("geolocation" in navigator)) { if (!saved) setState("unavailable"); return; }
    navigator.permissions?.query({ name: "geolocation" }).then((p) => {
      if (p.state === "granted" && !saved) {
        navigator.geolocation.getCurrentPosition((pos) => applyGps(pos.coords.latitude, pos.coords.longitude, DEFAULT_RADIUS, []), () => {}, { timeout: 8000, maximumAge: 300000 });
      } else if (p.state === "denied" && !saved) setState("denied");
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestGps = useCallback(() => {
    if (!("geolocation" in navigator)) { setState("unavailable"); return; }
    setState("prompting");
    track("location_permission_shown");
    clearTimeout(watchdog.current);
    watchdog.current = setTimeout(() => setState((s) => (s === "prompting" ? "unavailable" : s)), 8000); // fall back to the manual picker
    navigator.geolocation.getCurrentPosition(
      (pos) => { clearTimeout(watchdog.current); applyGps(pos.coords.latitude, pos.coords.longitude, radius, recent); track("location_permission_granted"); },
      (err) => { clearTimeout(watchdog.current); setState(err.code === 1 ? "denied" : "unavailable"); if (err.code === 1) track("location_permission_denied"); },
      { timeout: 8000, maximumAge: 300000 },
    );
  }, [applyGps, radius, recent]);

  const chooseArea = useCallback((slug: string) => {
    const a = AREA_BY_SLUG[slug];
    if (!a) return;
    const rec = [slug, ...recent.filter((s) => s !== slug)].slice(0, 4);
    setArea(a); setCoords({ lat: a.lat, lng: a.lng }); setState("manual"); setRecent(rec);
    persist(a, slug, "manual", radius, rec);
  }, [persist, radius, recent]);

  const setRadius = useCallback((km: number) => {
    setRadiusState(km);
    if (coords && area) persist(coords, area.slug, state === "granted" ? "gps" : "manual", km, recent);
  }, [area, coords, persist, recent, state]);

  const clear = useCallback(() => { clearLocation(); setCoords(null); setArea(null); setRecent([]); setState("unknown"); }, []);

  const loc = useMemo<Loc>(() => ({
    state, coords, area, radius, recent: recent.map((s) => AREA_BY_SLUG[s]).filter(Boolean),
    hasLocation: state === "granted" || state === "manual", sheetOpen,
    openSheet: () => setSheetOpen(true), closeSheet: () => setSheetOpen(false), requestGps, chooseArea, setRadius, clear,
  }), [state, coords, area, radius, recent, sheetOpen, requestGps, chooseArea, setRadius, clear]);

  const ui = useMemo(() => ({ heroSearchVisible, setHeroSearchVisible }), [heroSearchVisible]);

  return (
    <DataCtx.Provider value={data}>
      <LocCtx.Provider value={loc}>
        <UiCtx.Provider value={ui}>{children}</UiCtx.Provider>
      </LocCtx.Provider>
    </DataCtx.Provider>
  );
}
