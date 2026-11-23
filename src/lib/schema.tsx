import { BRAND } from "./config";
import type { PublicPro } from "./types";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const abs = (path: string) => `${SITE_URL}${path}`;

/** Renders one JSON-LD block. `<` is escaped so content can never close the script tag. */
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export const organizationLd = (phone?: string) => ({
  "@context": "https://schema.org", "@type": "Organization", name: BRAND.name, url: SITE_URL, email: BRAND.email, slogan: BRAND.tagline,
  ...(phone ? { telephone: phone } : {}), areaServed: { "@type": "City", name: "Nairobi" },
});

export const websiteLd = () => ({
  "@context": "https://schema.org", "@type": "WebSite", name: BRAND.name, url: SITE_URL,
  potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/services?q={search_term_string}` }, "query-input": "required name=search_term_string" },
});

export const breadcrumbLd = (items: { label: string; href?: string }[]) => ({
  "@context": "https://schema.org", "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.label, ...(it.href ? { item: abs(it.href) } : {}) })),
});

export const faqLd = (items: { q: string; a: string }[]) => ({
  "@context": "https://schema.org", "@type": "FAQPage",
  mainEntity: items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
});

/** A professional is described as a Service with a Person provider: schema.org allows AggregateRating and Offer on Service (not on Person). */
export const proLd = (p: PublicPro) => ({
  "@context": "https://schema.org", "@type": "Service", name: `${p.category} by ${p.name}`, serviceType: p.category,
  url: abs(`/pros/${p.slug}`), areaServed: { "@type": "Place", name: `${p.area}, Nairobi` },
  provider: { "@type": "Person", name: p.name, jobTitle: p.category, ...(p.bio ? { description: p.bio } : {}), ...(p.languages?.length ? { knowsLanguage: p.languages } : {}) },
  ...(p.rating.count > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: Number(p.rating.avg.toFixed(1)), reviewCount: p.rating.count, bestRating: 5, worstRating: 1 } } : {}),
  ...(p.fromPrice != null ? { offers: { "@type": "Offer", priceCurrency: "KES", price: p.fromPrice, priceSpecification: { "@type": "PriceSpecification", priceCurrency: "KES", minPrice: p.fromPrice } } } : {}),
});
