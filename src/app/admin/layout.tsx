import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { StoreProvider } from "@/lib/store";
import { getAdmin } from "@/server/auth";
import { getDb } from "@/server/db";

export const metadata: Metadata = { title: "Admin Dashboard", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

// Second gate (the middleware is the first): no valid session, no admin page and no data.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
  return (
    <StoreProvider initial={await getDb()}>
      <AdminShell email={admin.sub}>{children}</AdminShell>
    </StoreProvider>
  );
}
