import raw from "../../data/areas.json";
import type { ServiceArea } from "./types";

// Service areas: the curated Nairobi list in data/areas.json (approximate centres) plus any the admin adds in Settings.
// The lists below are shared by area pickers, slugs, SEO pages and "nearest area" lookups. They are updated in place by
// registerAreas(), so every import sees the current set. No paid geocoding service is used.
export type Area = ServiceArea;

const BASE: Area[] = raw;
export const AREA_LIST: Area[] = [...BASE];
export const AREA_BY_NAME: Record<string, Area> = {};
export const AREA_BY_SLUG: Record<string, Area> = {};
let signature = "";

const rebuild = () => {
  Object.keys(AREA_BY_NAME).forEach((k) => delete AREA_BY_NAME[k]);
  Object.keys(AREA_BY_SLUG).forEach((k) => delete AREA_BY_SLUG[k]);
  AREA_LIST.forEach((a) => { AREA_BY_NAME[a.name] = a; AREA_BY_SLUG[a.slug] = a; });
};
rebuild();

const valid = (a: Area) => a && typeof a.name === "string" && a.name.trim() && typeof a.slug === "string" && a.slug && Number.isFinite(a.lat) && Number.isFinite(a.lng);

/** Makes the areas the admin added available everywhere. Safe to call often: it does nothing unless they changed. */
export function registerAreas(extra?: Area[]) {
  const list = (extra ?? []).filter(valid);
  const sig = JSON.stringify(list);
  if (sig === signature) return;
  signature = sig;
  const taken = new Set(BASE.flatMap((a) => [a.name.toLowerCase(), a.slug]));
  AREA_LIST.length = 0;
  AREA_LIST.push(...BASE);
  for (const a of list) {
    if (taken.has(a.name.toLowerCase()) || taken.has(a.slug)) continue;
    taken.add(a.name.toLowerCase()); taken.add(a.slug);
    AREA_LIST.push(a);
  }
  rebuild();
}
export const BUILT_IN_AREAS = BASE;
