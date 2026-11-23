export type Provider = {
  id: string; name: string; category: string; qualifications: string[]; years: number;
  bio: string; area: string; lat: number; lng: number;
  pin?: { lat: number; lng: number }; // optional exact map pin chosen by the admin. Private: the public site only gets it rounded to about 1 km.
  active: boolean; // listed on the public site and open to new bookings
  // Private staff record. Never shown on the public site.
  phone: string; email?: string; idNumber?: string; joinedOn?: string;
  employment?: "active" | "resigned" | "terminated"; leftOn?: string; leftReason?: string;
  // Public profile fields (safe to publish). Absent means "not provided" and the site hides the line.
  slug?: string; photo?: string; gallery?: string[]; fromPrice?: number;
  availability?: "today" | "week" | "booked"; languages?: string[]; serviceRadiusKm?: number;
};

// What the public website is allowed to know about a professional. Built by a strict whitelist in
// src/server/public.ts. Never add phones, emails, ID numbers, addresses, customers or work orders here.
export type PublicPro = {
  ref: string; slug: string; name: string; category: string; area: string; areaSlug: string;
  lat: number; lng: number; // the base area's centre, or the admin's pin rounded to about 1 km. Never a precise location
  years: number; qualifications: string[]; rating: { avg: number; count: number; dist: number[] }; // dist = how many 1 to 5 star ratings
  photo?: string; gallery?: string[]; fromPrice?: number; availability?: "today" | "week" | "booked"; languages?: string[]; serviceRadiusKm?: number;
  bio?: string;
  reviews: { stars: number; comment: string; month: string }[]; // comments only, no customer names
};
export type PublicSettings = { businessName: string; adminPhone: string };
export type Customer = { id: string; name: string; phone: string; address: string };
export type Request = {
  id: string; name: string; phone: string; address: string; category: string;
  description: string; providerId?: string; status: "new" | "converted" | "dismissed"; createdAt: string;
};
export type WOStatus = "new" | "scheduled" | "in_progress" | "completed" | "cancelled";
export type Priority = "low" | "normal" | "urgent";
export type JobType = "Repair" | "Installation" | "Inspection" | "Maintenance";
export type Task = { id: string; title: string; done: boolean };
export type Activity = { id: string; at: string; text: string };
export type LineItem = { id: string; kind?: "service" | "part"; description: string; qty: number; unitPrice: number };
export type Payment = { id: string; amount: number; method: "Cash" | "M-Pesa" | "Bank" | "Card"; at: string };
export type WorkOrder = {
  items?: LineItem[]; payments?: Payment[];
  type?: JobType; area?: string; billable?: boolean; tasks?: Task[]; activity?: Activity[];
  signedBy?: string; signedAt?: string; // customer sign-off on the service report
  id: string; no: string; customerId: string; requestId?: string; category: string; title: string;
  description: string; providerId: string | null; status: WOStatus; priority: Priority;
  date?: string; time?: string; duration?: number; price?: number; notes: string; createdAt: string;
};
export type Settings = { businessName: string; adminPhone: string };
export type Rating = { id: string; workOrderId: string; providerId: string; stars: number; comment: string; createdAt: string };
export type DB = {
  providers: Provider[]; customers: Customer[]; requests: Request[]; workOrders: WorkOrder[]; ratings: Rating[]; settings: Settings;
};
