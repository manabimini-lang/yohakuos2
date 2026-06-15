"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Feather, History, MessageCircle, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "余白",
    href: "/inbox",
    icon: Feather,
  },
  {
    label: "記憶",
    href: "/memory",
    icon: History,
  },
  {
    label: "対話",
    href: "/dialogue",
    icon: MessageCircle,
  },
  {
    label: "設定",
    href: "/settings",
    icon: Settings,
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/80 backdrop-blur-lg pb-safe">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors",
                isActive ? "text-slate-950" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <div className={cn(
                "flex h-8 w-12 items-center justify-center rounded-full transition-colors",
                isActive && "bg-slate-100"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}