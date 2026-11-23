"use client";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Sheet } from "@/components/ds/sheet";

/** Work samples. Phones: swipeable strip with a counter. Desktop: grid. Tap or click opens a larger view. Only rendered when photos exist. */
export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const [index, setIndex] = useState(0);
  const strip = useRef<HTMLDivElement>(null);
  const onScroll = () => { const el = strip.current; if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth)); };
  return (
    <>
      <div className="relative sm:hidden">
        <div ref={strip} onScroll={onScroll} className="flex snap-x snap-mandatory overflow-x-auto rounded-card" role="group" aria-label={`${alt} photos`}>
          {images.map((src, i) => (
            <button key={src} onClick={() => setOpen(i)} className="aspect-[4/3] w-full shrink-0 snap-center" aria-label={`Open photo ${i + 1} of ${images.length}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`${alt}, photo ${i + 1}`} loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
        <span className="absolute bottom-3 right-3 rounded-full bg-inverse/80 px-2.5 py-1 text-small font-medium text-inverse-foreground" aria-live="polite">{index + 1}/{images.length}</span>
      </div>
      <div className={cn("hidden gap-2 sm:grid", images.length > 1 ? "grid-cols-4 grid-rows-2" : "grid-cols-1")}>
        {images.slice(0, 5).map((src, i) => (
          <button key={src} onClick={() => setOpen(i)} className={cn("relative overflow-hidden rounded-lg", i === 0 && images.length > 1 ? "col-span-2 row-span-2 aspect-[4/3]" : "aspect-[4/3]")} aria-label={`Open photo ${i + 1} of ${images.length}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`${alt}, photo ${i + 1}`} loading="lazy" className="h-full w-full object-cover transition-transform duration-400 ease-ui hover:scale-[1.03]" />
            {i === 4 && images.length > 5 && <span className="absolute inset-0 flex items-center justify-center bg-inverse/60 text-lg font-semibold text-inverse-foreground">+{images.length - 5}</span>}
          </button>
        ))}
      </div>
      <Sheet open={open !== null} onClose={() => setOpen(null)} title={`${alt}: photo ${(open ?? 0) + 1} of ${images.length}`} className="sm:max-w-3xl">
        {open !== null && (/* eslint-disable-next-line @next/next/no-img-element */ <img src={images[open]} alt={`${alt}, photo ${open + 1}`} className="max-h-[70vh] w-full rounded-lg object-contain" />)}
      </Sheet>
    </>
  );
}
