import { SiteProviders } from "@/components/site/providers";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { Analytics } from "@/components/site/analytics";
import { getPublicPros, getPublicSettings } from "@/server/public";

export const dynamic = "force-dynamic";

// Shared chrome for every public page. Data comes from the public read model only.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const pros = getPublicPros();
  const settings = getPublicSettings();
  return (
    <SiteProviders pros={pros} settings={settings}>
      <div className="site flex min-h-screen flex-col bg-background text-foreground">
        <a href="#main" className="sr-only z-[80] rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to content</a>
        <SiteHeader />
        <main id="main" className="flex-1">{children}</main>
        <SiteFooter phone={settings.adminPhone} />
      </div>
      <Analytics />
    </SiteProviders>
  );
}
