import { addDays, today } from "./utils";
import { AREAS, BRAND } from "./config";
import type { DB, Provider } from "./types";

const now = new Date().toISOString();

export const seed: DB = {
  settings: { businessName: BRAND.name, adminPhone: "+254722000000" },
  providers: ([
    { id: "p1", name: "Daniel Mwangi", category: "Plumbing", years: 12, area: "Nairobi West", active: true,
      phone: "+254711200101", email: "daniel.mwangi@example.com", idNumber: "22145678", joinedOn: "2022-03-14",
      qualifications: ["Certified Master Plumber", "Gas Fitting License"], bio: "Leak detection, pipe replacement and full bathroom installs." },
    { id: "p2", name: "Grace Atieno", category: "Plumbing", years: 7, area: "Kilimani", active: true,
      phone: "+254711200102", email: "grace.atieno@example.com", idNumber: "27890123", joinedOn: "2023-06-01",
      qualifications: ["NITA Grade I Plumbing"], bio: "Water heaters, drainage and kitchen plumbing." },
    { id: "p3", name: "Samuel Otieno", category: "Electrical", years: 15, area: "Westlands", active: true,
      phone: "+254711200103", email: "samuel.otieno@example.com", idNumber: "20456789", joinedOn: "2021-09-20",
      qualifications: ["Licensed Electrician (EPRA Class A)", "Solar PV Installer"], bio: "Wiring, DB upgrades, lighting and safety inspections." },
    { id: "p4", name: "Brian Kiptoo", category: "Masonry", years: 9, area: "Karen", active: true,
      phone: "+254711200104", idNumber: "29012345", joinedOn: "2023-01-09",
      qualifications: ["Trade Test Grade I Masonry"], bio: "Walling, plastering, tiling and stone work." },
    { id: "p5", name: "Faith Wanjiru", category: "Electrical", years: 6, area: "Ruaka", active: true,
      phone: "+254711200105", email: "faith.wanjiru@example.com", joinedOn: "2024-02-12",
      qualifications: ["NITA Grade II Electrical Installation"], bio: "Rewiring, socket fitting and lighting installs." },
    { id: "p6", name: "Peter Njoroge", category: "Carpentry", years: 20, area: "Thika Road", active: true,
      phone: "+254711200106", idNumber: "14567890", joinedOn: "2020-11-02",
      qualifications: ["Trade Test Grade I Carpentry"], bio: "Custom cabinets, doors, wardrobes and ceilings." },
    { id: "p7", name: "Amina Hassan", category: "Painting", years: 5, area: "South B", active: true,
      phone: "+254711200107", email: "amina.hassan@example.com", joinedOn: "2024-05-27",
      qualifications: ["Certificate in Painting and Decorating"], bio: "Interior and exterior painting with clean, durable finishes." },
    { id: "p8", name: "Joseph Kamau", category: "Masonry", years: 11, area: "CBD", active: true,
      phone: "+254711200108", idNumber: "24678901", joinedOn: "2022-08-15",
      qualifications: ["Licensed Building Contractor (Class 7)"], bio: "Structural repairs, tiling and general construction." },
  ] as Omit<Provider, "lat" | "lng">[]).map((p) => ({ ...p, ...AREAS[p.area] })),
  ratings: [
    { id: "rt1", workOrderId: "w3", providerId: "p3", stars: 5, comment: "Neat work, on time.", createdAt: now },
  ],
  customers: [
    { id: "c1", name: "Lucy Njeri", phone: "+254711000111", address: "Lavington, Nairobi" },
    { id: "c2", name: "Kevin Omondi", phone: "+254722000222", address: "Parklands, Nairobi" },
  ],
  requests: [],
  workOrders: [
    { id: "w1", no: "WO-0001", customerId: "c1", category: "Plumbing", title: "Fix leaking bathroom pipe",
      description: "Slow leak under the basin.", providerId: "p2", status: "scheduled", priority: "normal",
      date: today(), time: "10:00", duration: 2, price: 4500, notes: "", createdAt: now },
    { id: "w2", no: "WO-0002", customerId: "c2", category: "Masonry", title: "Tile bathroom floor",
      description: "About 8 square metres of floor tiles.", providerId: "p4", status: "in_progress", priority: "normal",
      date: today(), time: "14:00", duration: 4, price: 7000, notes: "", createdAt: now },
    { id: "w3", no: "WO-0003", customerId: "c1", category: "Electrical", title: "Install ceiling lights",
      description: "6 downlights in the lounge.", providerId: "p3", status: "completed", priority: "low",
      date: addDays(-2), time: "09:00", duration: 3, price: 9000, notes: "Completed, customer satisfied.", createdAt: now,
      payments: [{ id: "pay1", amount: 9000, method: "M-Pesa", at: now }] },
    { id: "w4", no: "WO-0004", customerId: "c2", category: "Electrical", title: "Sockets keep tripping the breaker",
      description: "Living room sockets. Customer called this morning.", providerId: null, status: "new", priority: "urgent",
      notes: "", createdAt: now },
  ],
};
