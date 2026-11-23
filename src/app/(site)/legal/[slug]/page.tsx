import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDocView } from "@/components/site/legal-doc";
import { JsonLd, breadcrumbLd } from "@/lib/schema";
import { getLegalDocs, readingMinutes } from "@/content/legal";

const SLUGS = ["terms", "privacy", "cookies", "pro-agreement", "cancellation-refunds", "acceptable-use"];
export const dynamicParams = false;
export function generateStaticParams() { return SLUGS.map((slug) => ({ slug })); }

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const d = SLUGS.includes(params.slug) ? getLegalDocs()[params.slug] : null;
  return d ? { title: d.title, description: d.description, alternates: { canonical: `/legal/${d.slug}` } } : {};
}

export default function LegalPage({ params }: { params: { slug: string } }) {
  const doc = SLUGS.includes(params.slug) ? getLegalDocs()[params.slug] : null;
  if (!doc) notFound();
  return (
    <>
      <JsonLd data={breadcrumbLd([{ label: "Home", href: "/" }, { label: doc.title }])} />
      <LegalDocView doc={doc} minutes={readingMinutes(doc)} />
    </>
  );
}
