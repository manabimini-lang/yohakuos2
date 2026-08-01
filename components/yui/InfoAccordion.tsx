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
          <button onClick={toggle} className="text-sm text-primary">
            {open ? "閉じる" : "開く"}
          </button>
        </div>
      </div>
      {open && <div className="p-4 border-t border-border/60">{children}</div>}
    </div>
  );
}
