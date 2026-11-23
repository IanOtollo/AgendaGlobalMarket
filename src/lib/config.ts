import { AREA_LIST } from "./areas";

export const BRAND = {
  name: "Agenda Global Market",
  tagline: "One Agenda. One World. One Market.",
  email: "info@agendaglobalmarket.co.ke",
  website: "www.agendaglobalmarket.co.ke",
};

export const CATEGORIES = ["Plumbing", "Carpentry", "Masonry", "Electrical", "Painting"] as const;

export const JOB_TYPES = ["Repair", "Installation", "Inspection", "Maintenance"] as const;

export const SERVICE_INFO: Record<string, string> = {
  Plumbing: "Leak repairs, pipe installation, bathroom and kitchen fitting.",
  Carpentry: "Doors, windows, cabinets, ceilings, wardrobes and custom woodwork.",
  Masonry: "Walling, plastering, repairs, tiling, stone work and structural finishes.",
  Electrical: "Installations, repairs, rewiring, lighting, socket fitting and safety upgrades.",
  Painting: "Interior and exterior painting, wall finishing and protective coatings.",
};

// Name -> coordinates, derived from the curated list in data/areas.json (see src/lib/areas.ts).
export const AREAS: Record<string, { lat: number; lng: number }> = Object.fromEntries(
  AREA_LIST.map((a) => [a.name, { lat: a.lat, lng: a.lng }]),
);
export const STATUS_LABEL = {
  new: "New", scheduled: "Scheduled", in_progress: "In progress", completed: "Completed", cancelled: "Cancelled",
} as const;
