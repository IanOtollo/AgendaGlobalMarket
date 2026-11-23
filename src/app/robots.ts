import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/schema";

// Keep the admin area and sign-in out of search engines. (Real protection is the sign-in, not this file.)
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/login", "/api/"] }], sitemap: `${SITE_URL}/sitemap.xml` };
}
