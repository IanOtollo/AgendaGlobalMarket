import {
  Armchair, BrickWall, Bug, Droplets, Drill, Fan, Flame, Hammer, Home, KeyRound, Lightbulb, PaintRoller, Ruler, ShowerHead,
  Shield, Shirt, Sparkles, Sprout, Sun, Truck, Wrench, Zap, type LucideIcon,
} from "lucide-react";
import { slugify } from "./slug";
import type { Trade } from "./types";

/** The trades the business offers. They live in Settings (editable by the admin); until the admin changes them these defaults apply. */
export const DEFAULT_TRADES: Trade[] = [
  { id: "t-plumbing", name: "Plumbing", noun: "Plumbers", icon: "droplets", blurb: "Plumbing and sanitary installations, leak repairs, bathroom and kitchen fitting." },
  { id: "t-carpentry", name: "Carpentry", noun: "Carpenters", icon: "hammer", blurb: "Doors, windows, cabinets, ceilings, wardrobes and custom woodwork." },
  { id: "t-masonry", name: "Masonry", noun: "Masons", icon: "brick", blurb: "Walling, plastering, repairs, tiling, stone work and structural finishes." },
  { id: "t-electrical", name: "Electrical", noun: "Electricians", icon: "zap", blurb: "Installations, repairs, rewiring, lighting, socket fitting and safety upgrades." },
  { id: "t-painting", name: "Painting", noun: "Painters", icon: "paint", blurb: "Professional painting and decoration, inside and out, wall finishing and protective coatings." },
  { id: "t-gardening", name: "Gardening & Landscaping", noun: "Gardeners", icon: "garden", blurb: "Gardening, landscaping and lawn care." },
  { id: "t-solar", name: "Solar Water Heating", noun: "Solar water heating specialists", icon: "sun", blurb: "Solar water heating systems." },
  { id: "t-laundry", name: "Laundry", noun: "Laundry specialists", icon: "shirt", blurb: "Household and commercial laundry, duvets, beddings and general linen." },
  { id: "t-cleaning", name: "Specialised Cleaning", noun: "Cleaners", icon: "sparkles", blurb: "Carpet and curtain cleaning, deep upholstery cleaning for sofas, couches, dining chairs and office seats, and stain and odour removal." },
  { id: "t-pest", name: "Pest Control", noun: "Pest control technicians", icon: "bug", blurb: "Bedbug inspection and eradication, general pest control, cockroach and rodent management, termite treatment and fumigation." },
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
  Plumbing: ["Masonry", "Painting"], Carpentry: ["Painting", "Masonry"], Masonry: ["Plumbing", "Painting"],
  Electrical: ["Carpentry", "Painting"], Painting: ["Masonry", "Carpentry"],
  "Gardening & Landscaping": ["Pest Control", "Masonry"], "Solar Water Heating": ["Plumbing", "Electrical"],
  Laundry: ["Specialised Cleaning", "Pest Control"], "Specialised Cleaning": ["Laundry", "Pest Control"], "Pest Control": ["Specialised Cleaning", "Gardening & Landscaping"],
};
export function relatedOf(name: string, trades: { name: string }[]): string[] {
  const names = trades.map((t) => t.name);
  const picked = (EDITORIAL[name] ?? []).filter((n) => names.includes(n));
  return picked.length ? picked : names.filter((n) => n !== name).slice(0, 2);
}
