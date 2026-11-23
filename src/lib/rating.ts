import type { Rating } from "./types";

export function ratingOf(ratings: Rating[], providerId: string) {
  const r = ratings.filter((x) => x.providerId === providerId);
  return { count: r.length, avg: r.length ? r.reduce((s, x) => s + x.stars, 0) / r.length : 0 };
}
