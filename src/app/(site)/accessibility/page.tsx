import type { Metadata } from "next";
import { LegalDocView } from "@/components/site/legal-doc";
import { getLegalDocs, readingMinutes } from "@/content/legal";

const doc = () => getLegalDocs().accessibility;
export function generateMetadata(): Metadata { const d = doc(); return { title: d.title, description: d.description, alternates: { canonical: "/accessibility" } }; }

export default function Page() {
  const d = doc();
  return <LegalDocView doc={d} minutes={readingMinutes(d)} />;
}
