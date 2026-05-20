import React from "react";
import { Metadata } from "next";
import { LegalLayout } from "@/components/legal/legal-layout";
import { LegalSection } from "@/components/legal/legal-section";
import { legalDocs } from "@/lib/legal/data";

const doc = legalDocs.privacy;

export const metadata: Metadata = {
  title: doc.title,
  description: doc.description,
  alternates: {
    canonical: "https://yohakuos2.vercel.app/privacy",
  },
  openGraph: {
    title: `${doc.title} | YOHAKU`,
    description: doc.description,
    url: "https://yohakuos2.vercel.app/privacy",
    type: "website",
  },
};

export default function PrivacyPage() {
  const tocItems = doc.sections.map((sec) => ({
    id: sec.id,
    title: sec.title.replace(/^\d+\.\s*/, ""), // clean up list numbers for TOC
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
