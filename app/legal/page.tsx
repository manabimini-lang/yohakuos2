import React from "react";
import { Metadata } from "next";
import { LegalLayout } from "@/components/legal/legal-layout";
import { LegalSection } from "@/components/legal/legal-section";
import { legalDocs } from "@/lib/legal/data";

const doc = legalDocs.legal;

export const metadata: Metadata = {
  title: doc.title,
  description: doc.description,
  alternates: {
    canonical: "https://yohakuos2.vercel.app/legal",
  },
  openGraph: {
    title: `${doc.title} | YOHAKU`,
    description: doc.description,
    url: "https://yohakuos2.vercel.app/legal",
    type: "website",
  },
};

export default function LegalPage() {
  const tocItems = doc.sections.map((sec) => ({
    id: sec.id,
    title: sec.title,
  }));

  return (
    <LegalLayout
      title={doc.title}
      description={doc.description}
      lastUpdated={doc.lastUpdated}
      tocItems={tocItems}
    >
      {doc.sections.map((section) => (
        <LegalSection
          key={section.id}
          id={section.id}
          title={section.title}
          blocks={section.blocks}
        />
      ))}
    </LegalLayout>
  );
}
