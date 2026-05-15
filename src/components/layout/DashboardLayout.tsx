import * as React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-white">
          <AppSidebar />
          <main className="flex-1 flex flex-col bg-white">
            <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-white/80 px-6 backdrop-blur">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <div className="flex-1">
                <h1 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  YOHAKU OS / 管理ダッシュボード
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <button className="h-8 w-8 rounded-full bg-gray-100 border border-gray-200" />
              </div>
            </header>
            <div className="flex-1 overflow-auto p-6 md:p-10">
              <div className="mx-auto max-w-5xl space-y-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
