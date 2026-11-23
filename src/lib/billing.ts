import type { LineItem, WorkOrder } from "./types";

// A work order with only a quoted price is treated as a single invoice line until items are added.
export const itemsOf = (wo: WorkOrder): LineItem[] =>
  wo.items ?? (wo.price ? [{ id: "quote", description: wo.title, qty: 1, unitPrice: wo.price }] : []);
export const totalOf = (wo: WorkOrder) => itemsOf(wo).reduce((s, i) => s + i.qty * i.unitPrice, 0);
export const paidOf = (wo: WorkOrder) => (wo.payments ?? []).reduce((s, p) => s + p.amount, 0);
export const balanceOf = (wo: WorkOrder) => totalOf(wo) - paidOf(wo);
export const payStatus = (wo: WorkOrder): "none" | "unpaid" | "part" | "paid" => {
  const t = totalOf(wo), p = paidOf(wo);
  return t === 0 ? "none" : p >= t ? "paid" : p > 0 ? "part" : "unpaid";
};
export const invoiceNo = (wo: WorkOrder) => wo.no.replace("WO", "INV");
