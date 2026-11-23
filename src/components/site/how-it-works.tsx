"use client";
import { motion, useReducedMotion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { ButtonLink } from "@/components/ds/button";
import { digits } from "@/lib/utils";
import { track } from "@/lib/analytics";

const STEPS = [
  { n: "1", t: "Choose a trade", d: "Compare pros by experience, ratings and area." },
  { n: "2", t: "Message the office", d: "WhatsApp or call. One number for every booking." },
  { n: "3", t: "We confirm the details", d: "Time and price are agreed before work starts." },
];
const ease = [0.16, 1, 0.3, 1] as const;
// One pass of about two seconds: each step lights up, a line carries on to the next, and the button arrives last.
const at = { step: [0, 0.85, 1.7], line: [0.35, 1.2], cta: 2.25 };

const pop = { hidden: { scale: 0.6, opacity: 0 }, show: (d: number) => ({ scale: 1, opacity: 1, transition: { delay: d, duration: 0.45, ease } }) };
const rise = { hidden: { opacity: 0, y: 14 }, show: (d: number) => ({ opacity: 1, y: 0, transition: { delay: d, duration: 0.5, ease } }) };
const grow = (axis: "x" | "y") => ({ hidden: axis === "x" ? { scaleX: 0 } : { scaleY: 0 }, show: (d: number) => ({ ...(axis === "x" ? { scaleX: 1 } : { scaleY: 1 }), transition: { delay: d, duration: 0.5, ease: "easeInOut" as const } }) });

/** "How it works" with one meaningful motion: step 1 leads to step 2 leads to step 3, then the next action appears. Plays once; static for reduced motion. */
export function HowItWorks({ phone }: { phone: string }) {
  const reduce = useReducedMotion();
  const wa = `https://wa.me/${digits(phone)}?text=${encodeURIComponent("Hi, I'd like to book a professional.")}`;
  return (
    <motion.div initial={reduce ? "show" : "hidden"} whileInView="show" viewport={{ once: true, margin: "-80px" }}>
      <ol className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
        {STEPS.map((s, i) => (
          <li key={s.n} className="relative flex gap-4 md:flex-col md:gap-5">
            {/* Desktop: the number and the line to the next step share one row, with the text underneath. */}
            <div className="flex shrink-0 items-center md:w-full">
              <span className="relative h-10 w-10 shrink-0" aria-hidden>
                <span className="absolute inset-0 flex items-center justify-center rounded-full border border-border-strong bg-muted text-base font-semibold text-muted-foreground">{s.n}</span>
                <motion.span custom={at.step[i]} variants={pop} className="absolute inset-0 flex items-center justify-center rounded-full bg-brand text-base font-semibold text-on-accent">{s.n}</motion.span>
              </span>
              {i < STEPS.length - 1 && (
                <span aria-hidden className="mx-3 hidden h-1.5 flex-1 overflow-hidden rounded-full bg-muted md:-mr-5 md:block">
                  <motion.span custom={at.line[i]} variants={grow("x")} className="block h-full origin-left rounded-full bg-brand" />
                </span>
              )}
            </div>
            <motion.div custom={at.step[i] + 0.1} variants={rise}>
              <h3 className="text-lg font-semibold">{s.t}</h3>
              <p className="mt-1.5 text-base leading-relaxed text-muted-foreground">{s.d}</p>
            </motion.div>
            {/* Phones: the line runs down beside the text, under the number. A 6px bar, so yellow stays a fill. */}
            {i < STEPS.length - 1 && (
              <span aria-hidden className="absolute left-[1.0625rem] top-[3rem] h-[calc(100%-1rem)] w-1.5 overflow-hidden rounded-full bg-muted md:hidden">
                <motion.span custom={at.line[i]} variants={grow("y")} className="block h-full origin-top rounded-full bg-brand" />
              </span>
            )}
          </li>
        ))}
      </ol>
      {phone && (
        <motion.div custom={at.cta} variants={rise} className="mt-10">
          <ButtonLink href={wa} external variant="accent" size="lg" onClick={() => track("booking_started", { from: "how_it_works" })}>
            <MessageCircle className="h-5 w-5" aria-hidden /> Message the office on WhatsApp
          </ButtonLink>
        </motion.div>
      )}
    </motion.div>
  );
}
