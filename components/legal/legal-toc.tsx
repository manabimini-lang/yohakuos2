"use client";

import React, { useEffect, useState } from "react";

interface TocItem {
  id: string;
  title: string;
}

interface LegalTOCProps {
  items: TocItem[];
}

export function LegalTOC({ items }: LegalTOCProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Find entries that are intersecting
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          // Set the first visible entry's target id as active
          // To make it smoother, grab the one closest to the top of the viewport
          const closest = visibleEntries.reduce((prev, curr) => {
            return Math.abs(curr.boundingClientRect.top) < Math.abs(prev.boundingClientRect.top) ? curr : prev;
          });
          setActiveId(closest.target.id);
        }
      },
      {
        rootMargin: "-80px 0px -60% 0px", // adjust to trigger when headings are near top
        threshold: 0.1,
      }
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => {
      items.forEach((item) => {
        const el = document.getElementById(item.id);
        if (el) observer.unobserve(el);
      });
    };
  }, [items]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setActiveId(id);
    }
  };

  return (
    <nav className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-4 hidden lg:block w-64 shrink-0 scrollbar-thin">
      <div className="space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          目次
        </p>
        <ul className="space-y-2 border-l border-slate-100 dark:border-slate-800/60 pl-0">
          {items.map((item) => {
            const isActive = activeId === item.id;
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(e) => handleClick(e, item.id)}
                  className={`block border-l-2 pl-4 py-1.5 text-xs font-normal transition-all duration-200 -ml-[1px] ${
                    isActive
                      ? "border-slate-900 text-slate-900 font-medium dark:border-slate-300 dark:text-slate-200"
                      : "border-transparent text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                  }`}
                >
                  {item.title}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
