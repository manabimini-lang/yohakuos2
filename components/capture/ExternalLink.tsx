"use client";

import { recordMemoryInteraction } from "@/app/actions/memory-interaction";
import { ReactNode } from "react";

export function ExternalLink({
  href,
  itemId,
  className,
  children,
}: {
  href: string;
  itemId: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => {
        recordMemoryInteraction(itemId, "click").catch(console.error);
      }}
    >
      {children}
    </a>
  );
}
