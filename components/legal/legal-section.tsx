import React from "react";
import { LegalBlock } from "@/lib/legal/data";
import { PolicyNotice } from "./policy-notice";

interface LegalSectionProps {
  id: string;
  title: string;
  blocks: LegalBlock[];
}

export function LegalSection({ id, title, blocks }: LegalSectionProps) {
  return (
    <section id={id} className="scroll-mt-20 space-y-6 py-6 border-b border-slate-100/80 dark:border-slate-800/40 last:border-b-0">
      <h2 className="text-xl font-medium tracking-tight text-slate-800 dark:text-slate-200">
        {title}
      </h2>
      <div className="space-y-4">
        {blocks.map((block, idx) => {
          switch (block.type) {
            case "paragraph":
              return (
                <p key={idx} className="text-[15px] leading-[1.85] text-slate-600 dark:text-slate-400 font-normal">
                  {block.text}
                </p>
              );
            case "list":
              return (
                <ul key={idx} className="list-disc pl-5 space-y-2.5 text-[15px] leading-[1.8] text-slate-600 dark:text-slate-400 marker:text-slate-300 dark:marker:text-slate-700">
                  {block.items?.map((item, itemIdx) => (
                    <li key={itemIdx} className="pl-1">
                      {item}
                    </li>
                  ))}
                </ul>
              );
            case "notice":
              return (
                <div key={idx} className="my-2">
                  <PolicyNotice text={block.text || ""} />
                </div>
              );
            default:
              return null;
          }
        })}
      </div>
    </section>
  );
}
