"use client";
import { useState, useRef } from "react";

type Props = {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

export default function InfoAccordion({ title, children, defaultOpen = false, onOpen }: Props & { onOpen?: () => void }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const calledRef = useRef(false);
  const contentId = useRef(`accordion-content-${Math.random().toString(36).substring(2, 9)}`).current;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && onOpen && !calledRef.current) {
      calledRef.current = true;
      try {
        onOpen();
      } catch (e) {
        // swallow
      }
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-background p-0">
      <div className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">{title}</p>
        </div>
        <div>
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-controls={contentId}
            className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md px-1.5 py-0.5 transition-colors"
          >
            {open ? "閉じる" : "開く"}
          </button>
        </div>
      </div>
      {open && (
        <div id={contentId} role="region" className="p-4 border-t border-border/60">
          {children}
        </div>
      )}
    </div>
  );
}
