"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ease } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} className="max-w-md text-center">
        <p className="text-sm font-semibold text-muted-foreground">Error 404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-3 text-muted-foreground">The page you requested does not exist or may have been moved.</p>
        <Link href="/" className="mt-8 inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90">
          Return to home page
        </Link>
      </motion.div>
    </main>
  );
}
