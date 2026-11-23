"use client";
import { motion, useReducedMotion } from "framer-motion";
import { ease, cn } from "@/lib/utils";

// Scroll-in fade. Renders plainly (no motion) when the visitor prefers reduced motion.
export function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={cn(className)}>{children}</div>;
  return (
    <motion.div className={cn(className)} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.4, ease, delay }}>
      {children}
    </motion.div>
  );
}
