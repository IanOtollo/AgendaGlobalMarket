import { ogCard } from "@/components/site/og-card";

export const alt = "Agenda Global Market: house and building maintenance in Nairobi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";

export default async function Image() {
  return ogCard({ eyebrow: "", title: "", brandOnly: true });
}
