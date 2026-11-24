import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { StoreProvider } from "@/lib/store";
import { ToastProvider } from "@/components/ui/toast";
import { ConfirmProvider } from "@/components/ui/confirm";
import { getAdmin } from "@/server/auth";
import { getDb } from "@/server/db";

export const metadata: Metadata = { title: "Admin Dashboard", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store"; // the admin always shows what is in the database right now, never a cached answer

// Second gate (the middleware is the first): no valid session, no admin page and no data.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
  return (
    <StoreProvider initial={await getDb()}>
      <ToastProvider>
        <ConfirmProvider>
          <AdminShell email={admin.sub}>{children}</AdminShell>
        </ConfirmProvider>
      </ToastProvider>
    </StoreProvider>
  );
}
