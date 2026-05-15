import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Sparkles,
  Youtube,
  BookOpen,
  MessageSquare,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";

const items = [
  {
    title: "ダッシュボード",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "会員ホーム",
    url: "/home",
    icon: BookOpen,
  },
  {
    title: "メンバー管理",
    url: "/members",
    icon: Users,
  },
  {
    title: "コンテンツ作成",
    url: "/content",
    icon: FileText,
  },
  {
    title: "AI アシスタント",
    url: "/ai",
    icon: Sparkles,
  },
];

const externalItems = [
  {
    title: "YouTube",
    url: "#",
    icon: Youtube,
  },
  {
    title: "note",
    url: "#",
    icon: BookOpen,
  },
  {
    title: "Discord",
    url: "#",
    icon: MessageSquare,
  },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar className="border-r border-border/50 bg-notion-bg">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center text-white font-bold">
            Y
          </div>
          <span className="text-xl font-bold tracking-tight">YOHAKU OS</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>メインメニュー</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium text-sm">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>外部連携</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {externalItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <a href={item.url} target="_blank" rel="noreferrer">
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium text-sm">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/settings">
                <Settings className="h-5 w-5" />
                <span className="font-medium text-sm">設定</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
