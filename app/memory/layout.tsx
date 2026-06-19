import type { ReactNode } from "react";
import MainBottomNav from "@/components/ui/main-bottom-nav";

export default function MemoryLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen">
      {children}
      <MainBottomNav />
    </div>
  );
}
