import type { ReactNode } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";

export default function InboxLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      {children}
      <BottomNav />
    </div>
  );
}
