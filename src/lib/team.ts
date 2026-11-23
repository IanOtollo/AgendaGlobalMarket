import type { Provider, WorkOrder } from "./types";
import { DEFAULT_HOURS, fmtTime, toMin } from "./schedule";
import { today } from "./utils";

// Currently employed (not resigned or let go).
export const isWorking = (p: Provider) => (p.employment ?? "active") === "active";
// Employed AND switched on for the public site and new bookings.
export const isBookable = (p: Provider) => isWorking(p) && p.active;

export function availability(providerId: string, orders: WorkOrder[]) {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const jobs = orders
    .filter((w) => w.providerId === providerId && w.date === today() && w.time && !["completed", "cancelled"].includes(w.status))
    .sort((a, b) => a.time!.localeCompare(b.time!));
  const end = (w: WorkOrder) => toMin(w.time!) + (w.duration ?? DEFAULT_HOURS) * 60;
  const current = jobs.find((w) => toMin(w.time!) <= nowMin && nowMin < end(w));
  if (current) return { busy: true, text: `On a job until ${fmtTime(end(current))}` };
  const upcoming = jobs.find((w) => toMin(w.time!) > nowMin);
  return { busy: false, text: upcoming ? `Free until ${upcoming.time}` : "Free today" };
}

export const initials = (name: string) => name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
