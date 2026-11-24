import { BRAND } from "@/lib/config";

// Server-safe brand mark for dark surfaces.
export function BrandMarkDark() {
  return (
    <span className="inline-flex">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo-dark.png" alt="" width={780} height={638} className="h-32 w-auto" />
      <span className="sr-only">{BRAND.name}</span>
    </span>
  );
}
