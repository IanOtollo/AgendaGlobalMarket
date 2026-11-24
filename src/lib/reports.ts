import { invoiceNo, paidOf, payStatus, totalOf } from "./billing";
import { DEFAULT_HOURS } from "./schedule";
import type { Customer, Provider, Rating, WorkOrder } from "./types";

// Everything the Reports page shows is computed here from the real work orders, payments, team and ratings.
// Nothing is sampled, estimated or filled in: a number is either calculated from a record or it is not shown.

export type Filters = {
  from: string; to: string; // inclusive, yyyy-mm-dd; empty = no limit
  providerId: string; category: string; area: string; status: string; pay: string; q: string; // empty = all
};
export const NO_FILTERS: Filters = { from: "", to: "", providerId: "", category: "", area: "", status: "", pay: "", q: "" };

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
/** The day a job belongs to: its appointment date, or the day it was logged if it has none yet. */
export const dateOf = (w: WorkOrder) => w.date ?? ymd(new Date(w.createdAt));
export const daysBetween = (a: string, b: string) => Math.round((new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime()) / 86400000);

export function presetRange(key: "month" | "last-month" | "30" | "year" | "all", now = new Date()): Pick<Filters, "from" | "to"> {
  const y = now.getFullYear(), m = now.getMonth();
  if (key === "month") return { from: ymd(new Date(y, m, 1)), to: ymd(new Date(y, m + 1, 0)) };
  if (key === "last-month") return { from: ymd(new Date(y, m - 1, 1)), to: ymd(new Date(y, m, 0)) };
  if (key === "30") return { from: ymd(new Date(y, m, now.getDate() - 29)), to: ymd(now) };
  if (key === "year") return { from: `${y}-01-01`, to: `${y}-12-31` };
  return { from: "", to: "" };
}

export function filterOrders(orders: WorkOrder[], f: Filters, customers: Customer[], providers: Provider[]): WorkOrder[] {
  const q = f.q.trim().toLowerCase();
  return orders.filter((w) => {
    const d = dateOf(w);
    if (f.from && d < f.from) return false;
    if (f.to && d > f.to) return false;
    if (f.providerId === "none" ? w.providerId : f.providerId && w.providerId !== f.providerId) return false;
    if (f.category && w.category !== f.category) return false;
    if (f.area && w.area !== f.area) return false;
    if (f.status && w.status !== f.status) return false;
    if (f.pay && payStatus(w) !== f.pay) return false;
    if (q) {
      const c = customers.find((x) => x.id === w.customerId);
      const p = providers.find((x) => x.id === w.providerId);
      if (![w.no, invoiceNo(w), w.title, w.category, w.area, c?.name, c?.phone, p?.name].some((s) => s?.toLowerCase().includes(q))) return false;
    }
    return true;
  });
}

// Cancelled jobs are never invoiced.
const billable = (w: WorkOrder) => w.status !== "cancelled";

export function summarise(orders: WorkOrder[]) {
  const live = orders.filter(billable);
  const invoiced = live.reduce((s, w) => s + totalOf(w), 0);
  const collected = live.reduce((s, w) => s + paidOf(w), 0);
  const invoices = live.filter((w) => totalOf(w) > 0);
  const count = (s: WorkOrder["status"]) => orders.filter((w) => w.status === s).length;
  return {
    jobs: orders.length, completed: count("completed"), cancelled: count("cancelled"), inProgress: count("in_progress"), scheduled: count("scheduled"), waiting: count("new"),
    invoiced, collected, outstanding: Math.max(0, invoiced - collected), invoiceCount: invoices.length,
    unpaidCount: invoices.filter((w) => payStatus(w) !== "paid").length,
    avgValue: invoices.length ? invoiced / invoices.length : 0,
    collectionRate: invoiced > 0 ? collected / invoiced : null,
    cancelRate: orders.length ? orders.filter((w) => w.status === "cancelled").length / orders.length : null,
    urgent: orders.filter((w) => w.priority === "urgent").length,
    unassigned: orders.filter((w) => !w.providerId && w.status !== "completed" && w.status !== "cancelled").length,
  };
}

/** Money still owed, grouped by how long ago the job was. */
export const AGEING = [
  { label: "0 to 7 days", min: 0, max: 7 }, { label: "8 to 30 days", min: 8, max: 30 },
  { label: "31 to 60 days", min: 31, max: 60 }, { label: "Over 60 days", min: 61, max: Infinity },
] as const;
export function ageing(orders: WorkOrder[], todayStr: string) {
  const owing = orders.filter((w) => billable(w) && totalOf(w) - paidOf(w) > 0);
  return AGEING.map((b) => {
    const inB = owing.filter((w) => { const d = Math.max(0, daysBetween(dateOf(w), todayStr)); return d >= b.min && d <= b.max; });
    return { label: b.label, count: inB.length, amount: inB.reduce((s, w) => s + (totalOf(w) - paidOf(w)), 0) };
  });
}

export function paymentsByMethod(orders: WorkOrder[]) {
  const m = new Map<string, { count: number; amount: number }>();
  orders.filter(billable).forEach((w) => (w.payments ?? []).forEach((p) => {
    const e = m.get(p.method) ?? { count: 0, amount: 0 };
    m.set(p.method, { count: e.count + 1, amount: e.amount + p.amount });
  }));
  return [...m.entries()].map(([method, v]) => ({ method, ...v })).sort((a, b) => b.amount - a.amount);
}

/** Jobs, completion and money grouped by any field of a work order (trade, area, job type). */
export function groupBy(orders: WorkOrder[], key: (w: WorkOrder) => string | undefined, empty = "Not set") {
  const m = new Map<string, WorkOrder[]>();
  orders.forEach((w) => { const k = key(w) || empty; m.set(k, [...(m.get(k) ?? []), w]); });
  return [...m.entries()].map(([name, list]) => ({
    name, jobs: list.length, completed: list.filter((w) => w.status === "completed").length,
    invoiced: list.filter(billable).reduce((s, w) => s + totalOf(w), 0), collected: list.filter(billable).reduce((s, w) => s + paidOf(w), 0),
  })).sort((a, b) => b.jobs - a.jobs || a.name.localeCompare(b.name));
}

/** Jobs and invoiced value per day (ranges up to 62 days) or per month, with empty periods included so gaps are visible. */
export function trend(orders: WorkOrder[]) {
  if (!orders.length) return { unit: "day" as const, points: [] as { key: string; label: string; jobs: number; invoiced: number }[] };
  const days = orders.map(dateOf).sort();
  const span = daysBetween(days[0], days[days.length - 1]);
  const unit = span <= 62 ? ("day" as const) : ("month" as const);
  const keyOf = (d: string) => (unit === "day" ? d : d.slice(0, 7));
  const m = new Map<string, { jobs: number; invoiced: number }>();
  orders.forEach((w) => { const k = keyOf(dateOf(w)); const e = m.get(k) ?? { jobs: 0, invoiced: 0 }; m.set(k, { jobs: e.jobs + 1, invoiced: e.invoiced + (billable(w) ? totalOf(w) : 0) }); });
  const keys: string[] = [];
  const cur = new Date(`${days[0]}T00:00:00`);
  const last = days[days.length - 1];
  for (let i = 0; i < 400; i++) {
    const k = keyOf(ymd(cur));
    if (!keys.includes(k)) keys.push(k);
    if (ymd(cur) >= last) break;
    if (unit === "day") cur.setDate(cur.getDate() + 1); else cur.setMonth(cur.getMonth() + 1, 1);
  }
  const label = (k: string) => (unit === "day" ? new Date(`${k}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    : new Date(`${k}-01T00:00:00`).toLocaleDateString("en-GB", { month: "short", year: "2-digit" }));
  return { unit, points: keys.map((k) => ({ key: k, label: label(k), jobs: m.get(k)?.jobs ?? 0, invoiced: m.get(k)?.invoiced ?? 0 })) };
}

export type WorkerRow = {
  id: string; name: string; category: string; left: boolean;
  assigned: number; completed: number; active: number; cancelled: number; completionRate: number | null;
  hours: number; invoiced: number; collected: number; avgJob: number; rating: number | null; ratings: number;
};
/** One row per team member who is working or has jobs in the filtered set. Hours are the booked length of completed jobs. */
export function workerRows(orders: WorkOrder[], providers: Provider[], ratings: Rating[]): WorkerRow[] {
  const ids = new Set(orders.map((w) => w.id));
  return providers.flatMap((p) => {
    const mine = orders.filter((w) => w.providerId === p.id);
    const working = (p.employment ?? "active") === "active";
    if (!mine.length && !working) return [];
    const done = mine.filter((w) => w.status === "completed");
    const active = mine.filter((w) => w.status === "scheduled" || w.status === "in_progress").length;
    const cancelled = mine.filter((w) => w.status === "cancelled").length;
    const counted = mine.length - cancelled;
    const rs = ratings.filter((r) => r.providerId === p.id && ids.has(r.workOrderId));
    const invoiced = done.reduce((s, w) => s + totalOf(w), 0);
    return [{
      id: p.id, name: p.name, category: p.category, left: !working,
      assigned: mine.length, completed: done.length, active, cancelled,
      completionRate: counted > 0 ? done.length / counted : null,
      hours: done.reduce((s, w) => s + (w.duration ?? DEFAULT_HOURS), 0),
      invoiced, collected: done.reduce((s, w) => s + paidOf(w), 0), avgJob: done.length ? invoiced / done.length : 0,
      rating: rs.length ? rs.reduce((s, r) => s + r.stars, 0) / rs.length : null, ratings: rs.length,
    }];
  });
}

const cell = (v: string | number) => { const s = String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
/** CSV text (with a byte-order mark so Excel reads it as UTF-8). */
export const toCsv = (head: string[], rows: (string | number)[][]) =>
  `﻿${[head, ...rows].map((r) => r.map(cell).join(",")).join("\r\n")}`;
