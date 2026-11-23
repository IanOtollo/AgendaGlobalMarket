import { CATEGORIES, SERVICE_INFO } from "./config";
import { slugify } from "./slug";

export const CATEGORY_LIST = CATEGORIES.map((name) => ({ name, slug: slugify(name), blurb: SERVICE_INFO[name] }));
export const categoryBySlug = (slug: string) => CATEGORY_LIST.find((c) => c.slug === slug);
export const categorySlug = (name: string) => slugify(name);

// Trades that are commonly needed together (used for "Related trades"). This is a fixed editorial
// mapping, not booking history, so it is labelled "Related trades" and never "customers also booked".
export const RELATED: Record<string, string[]> = {
  Plumbing: ["Masonry", "Painting"], Carpentry: ["Painting", "Masonry"], Masonry: ["Plumbing", "Painting"],
  Electrical: ["Carpentry", "Painting"], Painting: ["Masonry", "Carpentry"],
};

// People nouns for headlines and SEO titles ("Plumbers in Kilimani").
export const TRADE_NOUN: Record<string, string> = { Plumbing: "Plumbers", Carpentry: "Carpenters", Masonry: "Masons", Electrical: "Electricians", Painting: "Painters" };
