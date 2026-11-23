"use client";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { today, uid } from "./utils";
import { activity } from "./activity";
import type { DB, Provider, Customer, Request, WorkOrder, Settings } from "./types";

type Ctx = DB & {
  addProvider: (p: Omit<Provider, "id">) => void;
  updateProvider: (id: string, p: Partial<Provider>) => void;
  offboardProvider: (id: string, kind: "resigned" | "terminated", leftOn: string, leftReason: string) => void;
  reinstateProvider: (id: string) => void;
  addCustomer: (c: Omit<Customer, "id">) => string;
  addRequest: (r: Omit<Request, "id" | "status" | "createdAt">) => void;
  updateRequest: (id: string, r: Partial<Request>) => void;
  convertRequest: (id: string) => void;
  addWorkOrder: (w: Omit<WorkOrder, "id" | "no" | "createdAt" | "status"> & { status?: WorkOrder["status"] }) => string;
  updateWorkOrder: (id: string, w: Partial<WorkOrder>) => void;
  addRating: (r: { workOrderId: string; providerId: string; stars: number; comment: string }) => void;
  // Resolves true once the server has saved, false if it could not. `renames` (old trade name to new) carries existing records over.
  setSettings: (s: Settings, renames?: Record<string, string>) => Promise<boolean>;
};

const StoreCtx = createContext<Ctx | null>(null);
export const useStore = () => {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("StoreProvider missing");
  return c;
};

const nextNo = (d: DB) => `WO-${String(d.workOrders.length + 1).padStart(4, "0")}`;

// Admin only. `initial` is read on the server after the admin session is verified, so nothing is shown before it is loaded.
export function StoreProvider({ children, initial }: { children: ReactNode; initial: DB }) {
  const [db, setDb] = useState<DB>(initial);
  const ref = useRef<DB>(initial);
  const me = useRef(uid("client"));

  // Live connection: the server pushes every change made on any device. EventSource reconnects by itself.
  useEffect(() => {
    const es = new EventSource("/api/db/stream");
    es.onmessage = (e) => {
      const { db: next, by } = JSON.parse(e.data) as { db: DB; by: string };
      if (by === me.current) return; // my own change, already applied locally
      ref.current = next;
      setDb(next);
    };
    return () => es.close();
  }, []);

  // Apply locally right away, then send to the server which broadcasts to everyone else.
  const upd = (f: (d: DB) => DB): Promise<boolean> => {
    const next = f(ref.current);
    ref.current = next;
    setDb(next);
    return fetch("/api/db", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ db: next, by: me.current }),
    }).then((r) => r.ok).catch(() => false);
  };

  const value: Ctx = {
    ...db,
    addProvider: (p) => upd((d) => ({ ...d, providers: [...d.providers, { ...p, id: uid("p") }] })),
    updateProvider: (id, p) => upd((d) => ({ ...d, providers: d.providers.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
    // Resign / let go: keep the record and history, take them off the site, and return their open future jobs to the queue.
    offboardProvider: (id, kind, leftOn, leftReason) =>
      upd((d) => ({
        ...d,
        providers: d.providers.map((x) => (x.id === id ? { ...x, employment: kind, leftOn, leftReason, active: false } : x)),
        workOrders: d.workOrders.map((w) =>
          w.providerId === id && (w.status === "new" || w.status === "scheduled") && (!w.date || w.date >= today())
            ? { ...w, providerId: null, status: "new" }
            : w,
        ),
      })),
    reinstateProvider: (id) =>
      upd((d) => ({
        ...d,
        providers: d.providers.map((x) => (x.id === id ? { ...x, employment: "active", leftOn: undefined, leftReason: undefined } : x)),
      })),
    addCustomer: (c) => {
      const id = uid("c");
      upd((d) => ({ ...d, customers: [...d.customers, { ...c, id }] }));
      return id;
    },
    addRequest: (r) =>
      upd((d) => ({ ...d, requests: [{ ...r, id: uid("r"), status: "new", createdAt: new Date().toISOString() }, ...d.requests] })),
    updateRequest: (id, r) => upd((d) => ({ ...d, requests: d.requests.map((x) => (x.id === id ? { ...x, ...r } : x)) })),
    convertRequest: (id) =>
      upd((d) => {
        const r = d.requests.find((x) => x.id === id);
        if (!r) return d;
        let cust = d.customers.find((c) => c.phone === r.phone);
        const customers = cust ? d.customers : [...d.customers, (cust = { id: uid("c"), name: r.name, phone: r.phone, address: r.address })];
        const wo: WorkOrder = {
          id: uid("w"), no: nextNo(d), customerId: cust.id, requestId: r.id, category: r.category,
          title: `${r.category} service`, description: r.description, providerId: r.providerId ?? null,
          status: "new", priority: "normal", notes: "", createdAt: new Date().toISOString(),
        };
        return {
          ...d, customers, workOrders: [wo, ...d.workOrders],
          requests: d.requests.map((x) => (x.id === id ? { ...x, status: "converted" } : x)),
        };
      }),
    addWorkOrder: (w) => {
      const id = uid("w");
      upd((d) => ({
        ...d,
        workOrders: [
          { ...w, status: w.status ?? "new", id, no: nextNo(d), createdAt: new Date().toISOString(), activity: w.activity ?? [activity("Work order created")] },
          ...d.workOrders,
        ],
      }));
      return id;
    },
    updateWorkOrder: (id, w) => upd((d) => ({ ...d, workOrders: d.workOrders.map((x) => (x.id === id ? { ...x, ...w } : x)) })),
    addRating: (r) =>
      upd((d) =>
        d.ratings.some((x) => x.workOrderId === r.workOrderId)
          ? d
          : { ...d, ratings: [...d.ratings, { ...r, id: uid("rt"), createdAt: new Date().toISOString() }] },
      ),
    setSettings: (settings, renames = {}) => {
      const to = (c: string) => renames[c] ?? c;
      return upd((d) => ({
        ...d, settings,
        providers: d.providers.map((p) => ({ ...p, category: to(p.category) })),
        workOrders: d.workOrders.map((w) => ({ ...w, category: to(w.category) })),
        requests: d.requests.map((r) => ({ ...r, category: to(r.category) })),
      }));
    },
  };
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}
