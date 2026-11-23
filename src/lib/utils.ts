import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...i: ClassValue[]) => twMerge(clsx(i));
export const ease = [0.16, 1, 0.3, 1] as const;
// Unguessable ids (they appear in customer rating links), so use crypto, not Math.random.
export const uid = (p: string) => {
  const b = new Uint8Array(9);
  crypto.getRandomValues(b);
  return p + Array.from(b, (x) => x.toString(36).padStart(2, "0")).join("").slice(0, 12);
};
// Local calendar date (YYYY-MM-DD), not UTC, so "today" is correct late in the evening in Kenya.
const local = (d: Date) => {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().slice(0, 10);
};
export const today = () => local(new Date());
export const addDays = (d: number) => {
  const x = new Date();
  x.setDate(x.getDate() + d);
  return local(x);
};
export const fmtDate = (s?: string) =>
  s ? new Date(s + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : "—";
export const money = (n: number) => `KES ${n.toLocaleString("en-KE", { maximumFractionDigits: 2 })}`;
export const digits = (s: string) => s.replace(/\D/g, "");
