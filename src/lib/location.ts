import { AREA_LIST, AREA_BY_SLUG, type Area } from "./areas";
import { distanceKm } from "./geo";

export type LocState = "unknown" | "prompting" | "granted" | "denied" | "unavailable" | "manual";
export type StoredLocation = { lat: number; lng: number; areaSlug: string; source: "gps" | "manual"; radius: number; savedAt: number; recent: string[] };

const KEY = "agm-location-v1";
const TTL = 7 * 24 * 60 * 60 * 1000;
export const RADII = [2, 5, 10, 25] as const;
export const DEFAULT_RADIUS = 10;

// ~3 decimals is about 100 m: enough for "nearest professional", too coarse to locate a home.
export const round3 = (n: number) => Math.round(n * 1000) / 1000;

/** "Reverse geocoding" without a paid API: the nearest curated area centre. */
export function nearestArea(lat: number, lng: number): { area: Area; km: number } {
  let best = AREA_LIST[0], bestKm = Infinity;
  for (const a of AREA_LIST) {
    const km = distanceKm({ lat, lng }, a);
    if (km < bestKm) { best = a; bestKm = km; }
  }
  return { area: best, km: bestKm };
}

export function loadLocation(): StoredLocation | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as StoredLocation;
    if (Date.now() - s.savedAt > TTL || !AREA_BY_SLUG[s.areaSlug]) { localStorage.removeItem(KEY); return null; }
    return s;
  } catch { return null; }
}
export function saveLocation(s: Omit<StoredLocation, "savedAt">) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...s, savedAt: Date.now() })); } catch {}
}
export function clearLocation() { try { localStorage.removeItem(KEY); } catch {} }

/** "<1 km", "2.3 km", "12 km" */
export const kmLabel = (km: number) => (km < 1 ? "<1 km" : km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`);
