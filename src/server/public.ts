import { getDb } from "./db";
import type { DB } from "@/lib/types";
import { AREA_BY_NAME } from "@/lib/areas";
import { ratingOf } from "@/lib/rating";
import { slugify } from "@/lib/slug";
import { isBookable } from "@/lib/team";
import { tradesOf } from "@/lib/trades";
import type { PublicPro, PublicSettings } from "@/lib/types";

// The ONLY data the public website receives. Every field is copied by name; nothing is spread, so a new
// private field added to the model can never leak by accident.
export async function getPublicPros(): Promise<PublicPro[]> {
  return publicProsOf(await getDb());
}

export function publicProsOf(db: DB): PublicPro[] {
  return db.providers.filter(isBookable).map((p) => {
    const area = AREA_BY_NAME[p.area];
    const pro: PublicPro = {
      ref: p.id,
      slug: p.slug || slugify(p.name),
      name: p.name,
      category: p.category,
      area: p.area,
      areaSlug: area?.slug ?? slugify(p.area),
      // The admin's pin, rounded to 2 decimals (about 1.1 km), so a home address can never be read off the map.
      lat: p.pin ? Math.round(p.pin.lat * 100) / 100 : area?.lat ?? p.lat,
      lng: p.pin ? Math.round(p.pin.lng * 100) / 100 : area?.lng ?? p.lng,
      years: p.years,
      qualifications: [...p.qualifications],
      rating: { ...ratingOf(db.ratings, p.id), dist: [1, 2, 3, 4, 5].map((n) => db.ratings.filter((r) => r.providerId === p.id && r.stars === n).length) },
      // Review text and month only: never the customer, the job or the date of the visit.
      reviews: db.ratings.filter((r) => r.providerId === p.id && r.comment.trim()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 20)
        .map((r) => ({ stars: r.stars, comment: r.comment.trim(), month: r.createdAt.slice(0, 7) })),
    };
    if (p.bio?.trim()) pro.bio = p.bio.trim();
    if (p.photo) pro.photo = p.photo;
    if (p.gallery?.length) pro.gallery = [...p.gallery];
    if (typeof p.fromPrice === "number") pro.fromPrice = p.fromPrice;
    if (p.availability) pro.availability = p.availability;
    if (p.languages?.length) pro.languages = [...p.languages];
    if (typeof p.serviceRadiusKm === "number") pro.serviceRadiusKm = p.serviceRadiusKm;
    return pro;
  });
}

// The admin line is intentionally public: it is the one number customers are meant to call.
export async function getPublicSettings(): Promise<PublicSettings> {
  return publicSettingsOf(await getDb());
}

export function publicSettingsOf(db: DB): PublicSettings {
  const { businessName, adminPhone } = db.settings;
  return { businessName, adminPhone, trades: tradesOf(db.settings).map(({ slug: _slug, ...t }) => t) };
}
