"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, Moon, MessageCircle, BookOpen, Settings } from "lucide-react";

const navItems = [
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/reflection", label: "Reflection", icon: Moon },
  { href: "/companion", label: "Companion", icon: MessageCircle },
  { href: "/memory", label: "Memory", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-xl px-4 py-2 shadow-[0_-1px_0_rgba(255,255,255,0.04)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex w-full flex-col items-center justify-center rounded-2xl px-3 py-2 text-[11px] font-medium transition-colors ${
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`} />
              <span className="mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
