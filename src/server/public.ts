import { getDb } from "./db";
import { AREA_BY_NAME } from "@/lib/areas";
import { ratingOf } from "@/lib/rating";
import { slugify } from "@/lib/slug";
import { isBookable } from "@/lib/team";
import type { PublicPro, PublicSettings } from "@/lib/types";

// The ONLY data the public website receives. Every field is copied by name; nothing is spread, so a new
// private field added to the model can never leak by accident.
export function getPublicPros(): PublicPro[] {
  const db = getDb();
  return db.providers.filter(isBookable).map((p) => {
    const area = AREA_BY_NAME[p.area];
    const pro: PublicPro = {
      ref: p.id,
      slug: p.slug || slugify(p.name),
      name: p.name,
      category: p.category,
      area: p.area,
      areaSlug: area?.slug ?? slugify(p.area),
      lat: area?.lat ?? p.lat,
      lng: area?.lng ?? p.lng,
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
export function getPublicSettings(): PublicSettings {
  const { businessName, adminPhone } = getDb().settings;
  return { businessName, adminPhone };
}
