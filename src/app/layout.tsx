import type { Metadata, Viewport } from "next";
// Self-hosted variable fonts (no download at build or run time). Jost is the primary typeface, Inter the fallback.
import "@fontsource-variable/jost";
import "@fontsource-variable/inter";
import "./globals.css";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: `${BRAND.name}: Home, office and building care in Nairobi`, template: `%s · ${BRAND.name}` },
  description: "Maintenance, specialised cleaning and pest control by skilled professionals. One call or WhatsApp message and we manage the booking from start to finish.",
  openGraph: { siteName: BRAND.name, type: "website", locale: "en_KE", title: BRAND.name, description: "Home, office and building care in Nairobi, booked through one office." },
};
export const viewport: Viewport = { themeColor: [{ media: "(prefers-color-scheme: light)", color: "#FAFBFC" }, { media: "(prefers-color-scheme: dark)", color: "#090E1A" }] };

// No data provider here: public pages must never load the private store. The admin layout adds it.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
