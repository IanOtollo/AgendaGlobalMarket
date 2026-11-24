import {
  Armchair, BrickWall, Bug, Droplets, Drill, Fan, Flame, Hammer, Home, KeyRound, Lightbulb, PaintRoller, Ruler, ShowerHead,
  Shield, Shirt, Sparkles, Sprout, Sun, Truck, Wrench, Zap, type LucideIcon,
} from "lucide-react";
import { slugify } from "./slug";
import type { Trade } from "./types";

/** The trades the business offers. They live in Settings (editable by the admin); until the admin changes them these defaults apply. */
export const DEFAULT_TRADES: Trade[] = [
  { id: "t-plumbing", name: "Plumbing", noun: "Plumbers", icon: "droplets", blurb: "Leaky tap? Blocked drain? Low water pressure? We fix it fast and right!" },
  { id: "t-electrical", name: "Electrical", noun: "Electricians", icon: "zap", blurb: "Safe, reliable and efficient electrical solutions for your home or business." },
  { id: "t-carpentry", name: "Carpentry", noun: "Carpenters", icon: "hammer", blurb: "Quality, custom and reliable carpentry solutions for your home and office." },
  { id: "t-masonry", name: "Masonry", noun: "Masons", icon: "brick", blurb: "Strong, durable and professional building solutions." },
  { id: "t-painting", name: "Painting", noun: "Painters", icon: "paint", blurb: "Give your space a fresh, clean and lasting finish." },
  { id: "t-gardening", name: "Landscaping & Gardening", noun: "Landscapers and gardeners", icon: "garden", blurb: "Beautiful, healthy and well-maintained outdoor spaces." },
  { id: "t-pest", name: "Fumigation & Pest Control", noun: "Pest control technicians", icon: "bug", blurb: "A cleaner, healthier and pest-free environment for your home or business." },
  { id: "t-laundry", name: "Laundry & Upholstery", noun: "Laundry and cleaning specialists", icon: "shirt", blurb: "Laundry for household and institutional linen, carpet and curtain cleaning, upholstery cleaning, bedbug removal and deep sanitation." },
  { id: "t-solar", name: "Solar Water & Energy", noun: "Solar technicians", icon: "sun", blurb: "Clean, reliable and cost-saving energy for your home or business." },
];

/** Icons an admin can pick for a trade (stored by key, so the list can grow without touching saved data). */
export const TRADE_ICONS: Record<string, { Icon: LucideIcon; label: string }> = {
  droplets: { Icon: Droplets, label: "Water" }, hammer: { Icon: Hammer, label: "Hammer" }, brick: { Icon: BrickWall, label: "Bricks" },
  zap: { Icon: Zap, label: "Electric" }, paint: { Icon: PaintRoller, label: "Paint roller" }, wrench: { Icon: Wrench, label: "Wrench" },
  home: { Icon: Home, label: "House" }, garden: { Icon: Sprout, label: "Garden" }, flame: { Icon: Flame, label: "Gas and heat" },
  fan: { Icon: Fan, label: "Air and fans" }, key: { Icon: KeyRound, label: "Locks" }, truck: { Icon: Truck, label: "Moving" },
  sparkles: { Icon: Sparkles, label: "Cleaning" }, bug: { Icon: Bug, label: "Pest control" }, drill: { Icon: Drill, label: "Drill" },
  ruler: { Icon: Ruler, label: "Measuring" }, lightbulb: { Icon: Lightbulb, label: "Lighting" }, shower: { Icon: ShowerHead, label: "Bathroom" },
  armchair: { Icon: Armchair, label: "Furniture" }, shield: { Icon: Shield, label: "Security" },
  sun: { Icon: Sun, label: "Solar" }, shirt: { Icon: Shirt, label: "Laundry" },
};
export const iconOf = (key?: string): LucideIcon => TRADE_ICONS[key ?? ""]?.Icon ?? Wrench;

export type TradeView = Trade & { slug: string };
export const tradesOf = (s?: { trades?: Trade[] } | null): TradeView[] =>
  (s?.trades?.length ? s.trades : DEFAULT_TRADES).map((t) => ({ ...t, slug: slugify(t.name) }));
export const tradeBySlug = (trades: TradeView[], slug: string) => trades.find((t) => t.slug === slug);
export const tradeByName = (trades: TradeView[], name: string) => trades.find((t) => t.name === name);
export const categorySlug = slugify;

// Trades that are commonly needed together (used for "Related trades"). This is a fixed editorial mapping, not
// booking history, so it is labelled "Related trades" and never "customers also booked". New trades fall back to their neighbours.
const EDITORIAL: Record<string, string[]> = {
  Plumbing: ["Solar Water & Energy", "Masonry"], Electrical: ["Solar Water & Energy", "Carpentry"], Carpentry: ["Painting", "Masonry"],
  Masonry: ["Plumbing", "Painting"], Painting: ["Masonry", "Carpentry"], "Landscaping & Gardening": ["Fumigation & Pest Control", "Masonry"],
  "Fumigation & Pest Control": ["Laundry & Upholstery", "Landscaping & Gardening"], "Laundry & Upholstery": ["Fumigation & Pest Control", "Painting"],
  "Solar Water & Energy": ["Plumbing", "Electrical"],
};
export function relatedOf(name: string, trades: { name: string }[]): string[] {
  const names = trades.map((t) => t.name);
  const picked = (EDITORIAL[name] ?? []).filter((n) => names.includes(n));
  return picked.length ? picked : names.filter((n) => n !== name).slice(0, 2);
}
