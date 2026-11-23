import raw from "../../data/areas.json";

// Curated Nairobi areas (approximate centres). Single source for area pickers, slugs, SEO pages and
// "nearest area" lookups. No paid geocoding service is used.
export type Area = { name: string; slug: string; lat: number; lng: number };

export const AREA_LIST: Area[] = raw;
export const AREA_BY_NAME: Record<string, Area> = Object.fromEntries(AREA_LIST.map((a) => [a.name, a]));
export const AREA_BY_SLUG: Record<string, Area> = Object.fromEntries(AREA_LIST.map((a) => [a.slug, a]));
