"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { navigateWithTransition } from "@/lib/view-transition";
import { ArrowRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { kmLabel } from "@/lib/location";
import { ProfileGlyph } from "./profile-glyph";
import { track } from "@/lib/analytics";
import { Pill, Skeleton } from "@/components/ds/primitives";
import type { PublicPro } from "@/lib/types";

import { kes } from "@/lib/kes";

const AVAIL = {
  today: { label: "Available today", tone: "success" as const },
  week: { label: "Available this week", tone: "neutral" as const },
  booked: { label: "Fully booked", tone: "warning" as const },
};

/** Photo, or a designed initials block on the navy surface when no photo has been provided yet. */
export function ProAvatar({ pro, className, size = "card" }: { pro: PublicPro; className?: string; size?: "card" | "sm" | "xl" }) {
  if (pro.photo) return <Image src={pro.photo} alt={pro.name} width={640} height={480} unoptimized className={cn("h-full w-full object-cover", className)} />;
  return (
    <div aria-hidden className={cn("relative flex h-full w-full items-end justify-center overflow-hidden bg-inverse", className)}>
      <span className={cn("absolute rounded-full border border-brand/30", size === "sm" ? "h-12 w-12" : size === "xl" ? "h-64 w-64" : "h-28 w-28")} />
      <ProfileGlyph className={cn("relative text-inverse-foreground/85", size === "sm" ? "h-9 w-9" : size === "xl" ? "h-60 w-60" : "h-28 w-28")} />
    </div>
  );
}

export function RatingLine({ pro }: { pro: PublicPro }) {
  return pro.rating.count > 0 ? (
    <span className="inline-flex items-center gap-1 font-medium">
      <Star className="h-4 w-4 fill-foreground text-foreground" aria-hidden />
      <span><span className="sr-only">Rated </span>{pro.rating.avg.toFixed(1)}<span className="sr-only"> out of 5</span></span>
      <span className="font-normal text-muted-foreground">({pro.rating.count})</span>
    </span>
  ) : (
    <Pill>New</Pill>
  );
}

export function ProCard({ pro, km, variant = "default", selected }: { pro: PublicPro; km?: number | null; variant?: "default" | "compact"; selected?: boolean }) {
  const router = useRouter();
  const avail = pro.availability ? AVAIL[pro.availability] : null;
  const href = `/pros/${pro.slug}`;
  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => { track("pro_card_clicked", { slug: pro.slug }); navigateWithTransition(e, href, router.push); };

  if (variant === "compact") {
    return (
      <Link href={href} onClick={onClick} data-pro-card
        className={cn("group flex min-w-[17rem] items-center gap-4 rounded-card border bg-card p-3 transition duration-240 ease-ui hover:-translate-y-0.5 hover:shadow-hover", selected ? "border-primary ring-2 ring-primary" : "border-border")}>
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg"><ProAvatar pro={pro} size="sm" /></div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold">{pro.name}</h3>
          <p className="truncate text-small text-muted-foreground">{pro.category} · {pro.area}</p>
          <p className="mt-1 flex items-center gap-2 text-small"><RatingLine pro={pro} />{km != null && <span className="text-muted-foreground">{kmLabel(km)}</span>}</p>
        </div>
      </Link>
    );
  }

  return (
    <Link href={href} onClick={onClick} data-pro-card
      className={cn("group flex h-full flex-col overflow-hidden rounded-card border bg-card transition duration-240 ease-ui hover:-translate-y-0.5 hover:shadow-hover", selected ? "border-primary ring-2 ring-primary" : "border-border")}>
      <div className="relative aspect-[4/3] overflow-hidden">
        <div data-vt-source className="h-full w-full transition-transform duration-400 ease-ui group-hover:scale-[1.03]"><ProAvatar pro={pro} /></div>
        {avail && <Pill tone={avail.tone} className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] bg-card px-2 py-0.5 text-[11px] shadow-sm sm:bottom-3 sm:left-3 sm:max-w-none sm:px-3 sm:py-1 sm:text-sm"><span className={cn("h-2 w-2 shrink-0 rounded-full", avail.tone === "success" ? "bg-success" : avail.tone === "warning" ? "bg-warning" : "bg-muted-foreground")} aria-hidden /><span className="truncate">{avail.label}</span></Pill>}
      </div>
      {/* Compact on phones so two cards sit side by side; roomier from tablet up. */}
      <div className="flex flex-1 flex-col p-2.5 sm:p-3.5">
        <h3 className="truncate text-[15px] font-semibold sm:text-[15px]">{pro.name}</h3>
        <p className="truncate text-[13px] text-muted-foreground sm:text-sm">{pro.category} · {pro.area}</p>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] sm:mt-2 sm:text-sm">
          <RatingLine pro={pro} />
          {km != null && <><span aria-hidden className="text-muted-foreground">·</span><span className="text-muted-foreground">{kmLabel(km)} away</span></>}
        </p>
        <p className="mt-1 text-[13px] text-muted-foreground sm:text-sm">{pro.years} {pro.years === 1 ? "year" : "years"} experience</p>
        <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border pt-2 sm:mt-3 sm:gap-3 sm:pt-2.5">
          {/* Never cut off: if the card is too narrow, "/ visit" drops to the next line instead of being truncated. */}
          <span className="min-w-0 text-[13px] font-semibold leading-snug sm:text-sm">{pro.fromPrice != null ? <>From {kes(pro.fromPrice)}{" "}<span className="hidden whitespace-nowrap font-normal text-muted-foreground sm:inline">/ visit</span></> : <span className="font-medium text-muted-foreground">View profile</span>}</span>
          <span className="flex shrink-0 items-center gap-1 text-[15px] font-medium text-foreground">
            <span className="hidden opacity-0 transition-opacity duration-150 group-hover:opacity-100 sm:inline">View</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Same dimensions as ProCard, so loading causes no layout shift. */
export function ProCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-card border border-border bg-card" aria-hidden>
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="flex flex-1 flex-col gap-2 p-2.5 sm:p-3.5">
        <Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/3" />
        <Skeleton className="mt-4 h-9 w-full" />
      </div>
    </div>
  );
}

/** 2 columns on phones (tight 12px gap), 3 from 640, 4 from 1024, 5 from 1280. */
export function ProGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5", className)}>{children}</div>;
}
