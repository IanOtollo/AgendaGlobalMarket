import { BRAND } from "@/lib/config";

// Server-safe brand mark for dark surfaces.
export function BrandMarkDark() {
  return (
    <span className="inline-flex rounded-xl bg-white px-3 py-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo.png" alt="" width={570} height={170} className="h-10 w-auto" />
      <span className="sr-only">{BRAND.name}</span>
    </span>
  );
}
