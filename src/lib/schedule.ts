import type { WorkOrder } from "./types";

export const DEFAULT_HOURS = 2;
export const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
export const fmtTime = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
export const slot = (w: Pick<WorkOrder, "time" | "duration">) =>
  w.time ? `${w.time}–${fmtTime(toMin(w.time) + (w.duration ?? DEFAULT_HOURS) * 60)}` : "";

// Returns the job that overlaps the requested slot for this provider, if any.
export function findConflict(
  orders: WorkOrder[], providerId: string | null | undefined, date?: string, time?: string,
  hours: number = DEFAULT_HOURS, excludeId?: string,
) {
  if (!providerId || !date || !time) return undefined;
  const s = toMin(time), e = s + hours * 60;
  return orders.find((w) => {
    if (w.id === excludeId || w.providerId !== providerId || w.date !== date || !w.time || w.status === "cancelled") return false;
    const ws = toMin(w.time), we = ws + (w.duration ?? DEFAULT_HOURS) * 60;
    return s < we && ws < e;
  });
}
