"use client";
import Script from "next/script";

// Cookieless Umami. Loads only when configured, and never when the visitor sends Do Not Track.
export function Analytics() {
  const src = process.env.NEXT_PUBLIC_UMAMI_SRC;
  const id = process.env.NEXT_PUBLIC_UMAMI_ID;
  if (!src || !id) return null;
  return <Script src={src} data-website-id={id} data-do-not-track="true" strategy="afterInteractive" />;
}
