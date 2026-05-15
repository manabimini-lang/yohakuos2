import * as React from "react";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  BrainCircuit, 
  LogOut,
  ChevronRight,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Link, useLocation } from "react-router-dom";

interface SidebarItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const mainNav: SidebarItem[] = [
  { icon: LayoutDashboard, label: "ダッシュボード", href: "/dashboard" },
  { icon: BrainCircuit, label: "AI アシスタント", href: "/" },
  { icon: Users, label: "メンバー管理", href: "/members" },
  { icon: FileText, label: "コンテンツ管理", href: "/content" },
];

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="w-64 border-r bg-notion-bg flex flex-col h-screen h-svh sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center text-white font-black shadow-lg shadow-brand/20">
          Y
        </div>
        <span className="font-black text-lg tracking-tight">YOHAKU OS</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6">
        <div>
          <p className="px-2 mb-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            メインメニュー
          </p>
          <div className="space-y-1">
            {mainNav.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm font-bold transition-colors",
                    isActive 
                      ? "bg-brand/5 text-brand" 
                      : "text-muted-foreground hover:bg-notion-hover hover:text-notion-text"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div>
           <div className="flex items-center justify-between px-2 mb-2">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              カテゴリ
            </p>
            <Button variant="ghost" size="icon" className="h-4 w-4">
              <Plus className="h-3 w-3" />
            </Button>
           </div>
           <div className="space-y-1">
             {["探究学習", "ICT活用", "ライフハック"].map(cat => (
               <div key={cat} className="flex items-center justify-between px-2 py-1.5 rounded-lg text-sm font-bold text-muted-foreground hover:bg-notion-hover hover:text-notion-text cursor-pointer">
                 <div className="flex items-center gap-2">
                   <ChevronRight className="h-3 w-3" />
                   {cat}
                 </div>
               </div>
             ))}
           </div>
        </div>
      </div>

      <div className="p-4 border-t space-y-4">
        <div className="flex items-center gap-3 px-2">
          <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
            {user?.email?.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate">Member</p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          onClick={signOut}
          className="w-full justify-start text-xs font-bold text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-4 w-4 mr-2" />
          ログアウト
        </Button>
      </div>
    </div>
  );
}
