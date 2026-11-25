"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUp } from "lucide-react";

const SHOW_AFTER = 480; // px scrolled before the button appears
const RING = 2 * Math.PI * 21; // circumference of the progress ring

/**
 * Round yellow back-to-top button with a progress ring that fills as the page is read. Fades in after the first screen,
 * sits clear of the phone booking bar, and scrolls instantly when the visitor prefers reduced motion.
 */
export function ScrollToTop() {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setShown(window.scrollY > SHOW_AFTER);
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);

  return (
    <AnimatePresence>
      {shown && (
        <motion.button
          type="button"
          aria-label="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })}
          initial={reduce ? false : { opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.9 }}
          whileHover={reduce ? undefined : { y: -3 }}
          whileTap={reduce ? undefined : { scale: 0.94 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="group fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-on-accent shadow-hover ring-1 ring-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:bottom-8 sm:right-8 print:hidden"
        >
          <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 48 48" aria-hidden>
            <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="3" />
            <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray={RING} strokeDashoffset={RING * (1 - progress)} />
          </svg>
          <ArrowUp className="relative h-6 w-6 transition-transform duration-200 group-hover:-translate-y-0.5" strokeWidth={2.5} aria-hidden />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
