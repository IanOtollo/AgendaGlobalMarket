// What each service covers, in the client's own words (from their service flyers), with the photo used on the site.
// Looked up by the trade's name, so a trade the admin adds or renames simply has no extra detail and shows its short description.
export type ServiceDetail = {
  title: string; // the page heading, e.g. "Plumbing Services"
  image: string; // under /public/images/services
  solutions: string[];
  badges?: string[]; // short promises printed on the flyer
};

const D: Record<string, ServiceDetail> = {
  Plumbing: {
    title: "Plumbing Services", image: "/images/services/plumbing.jpg", badges: ["Fast, reliable & professional service"],
    solutions: ["Leak detection & repairs", "Blocked drains & sewer cleaning", "Installation of taps, toilets & showers", "Water heater & solar water system servicing", "Borehole & water pump installation", "Water storage (tanks) & piping systems"],
  },
  Electrical: {
    title: "Electrical Services", image: "/images/services/electrical.jpg",
    solutions: ["Fault finding & repairs", "Electrical installations & upgrades", "Lighting (indoor & outdoor)", "Power backup (inverters & solar)", "Safety inspections & compliance"],
  },
  Carpentry: {
    title: "Carpentry Services", image: "/images/services/carpentry.jpg",
    solutions: ["Custom furniture & fittings", "Cabinets, wardrobes & shelves", "Doors, frames & repairs", "Office and store fittings", "General woodwork & maintenance"],
  },
  Masonry: {
    title: "Masonry & Building Maintenance", image: "/images/services/masonry.jpg",
    solutions: ["Wall construction & repairs", "Cabro & stonework installation", "Tiling (floors & walls)", "Plastering & skimming", "General building maintenance and renovations"],
  },
  Painting: {
    title: "Painting Services", image: "/images/services/painting.jpg",
    solutions: ["Interior & exterior painting", "Wall preparation & repairs", "Professional, durable finishes", "Texture & decorative coatings", "Colour consultation"],
  },
  "Landscaping & Gardening": {
    title: "Landscaping & Gardening", image: "/images/services/landscaping-gardening.jpg",
    solutions: ["Garden design & layout", "Lawn installation & maintenance", "Planting, pruning & hedge trimming", "Irrigation system installation", "Outdoor beautification for homes, estates & offices"],
  },
  "Fumigation & Pest Control": {
    title: "Fumigation & Pest Control", image: "/images/services/pest-control.jpg",
    solutions: ["General fumigation (homes & offices)", "Termite control", "Bedbug elimination", "Rodent (rats & mice) control", "Cockroach, ant & other insect control", "Safe, approved & eco-friendly products"],
  },
  "Laundry & Upholstery": {
    title: "Professional Laundry & Upholstery Cleaning", image: "/images/services/laundry-upholstery.jpg", badges: ["Fresh", "Hygienic", "Professional"],
    solutions: ["Laundry for household & institutional linen", "Carpet & curtain cleaning", "Upholstery cleaning (sofas, seats & office furniture)", "Bedbug removal & deep sanitation"],
  },
  "Solar Water & Energy": {
    title: "Solar Water & Energy Solutions", image: "/images/services/solar-water-energy.jpg", badges: ["Sustainable", "Affordable", "Reliable"],
    solutions: ["Solar water heating systems", "Installation, servicing & maintenance", "Energy-saving solutions", "Systems for homes, estates & institutions"],
  },
};

export const serviceDetail = (tradeName: string): ServiceDetail | undefined => D[tradeName];
