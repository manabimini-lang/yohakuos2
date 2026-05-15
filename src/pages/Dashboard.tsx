import * as React from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, LogOut, User as UserIcon, Shield } from "lucide-react";

export default function Dashboard() {
  const { user, signOut } = useAuth();

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-brand font-black uppercase tracking-[0.2em] text-xs">
            <BrainCircuit className="h-4 w-4" />
            YOHAKU OS Dashboard
          </div>
          <h1 className="text-3xl font-black tracking-tight">ダッシュボード</h1>
          <p className="text-muted-foreground text-sm max-w-lg">
            ようこそ、{user?.email} さん。ログイン状態は正常です。
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={signOut}
          className="rounded-full font-bold h-10 px-6 border-border/50 bg-white hover:bg-destructive hover:text-white transition-all"
        >
          <LogOut className="h-4 w-4 mr-2" />
          ログアウト
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-md overflow-hidden bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-brand" />
              ユーザー情報
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="py-2 border-b border-border/10 flex justify-between">
              <span className="text-xs font-bold text-muted-foreground">ID</span>
              <span className="text-xs font-mono">{user?.id.substring(0, 8)}...</span>
            </div>
            <div className="py-2 border-b border-border/10 flex justify-between">
              <span className="text-xs font-bold text-muted-foreground">Email</span>
              <span className="text-xs font-medium">{user?.email}</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-xs font-bold text-muted-foreground">最終サインイン</span>
              <span className="text-xs font-medium">{new Date(user?.last_sign_in_at || '').toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md overflow-hidden bg-white md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              システムステータス
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="p-4 rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm font-medium">
                Supabase Authentication 接続中: 認証トークンは正常に保持されています。
             </div>
             <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                今後、ここには「KPI管理」や「会員管理」などのウィジェットが配置されます。
                認証情報に基づいた「学級軍師機能」などのパーソナライズされたAIアシスタント機能がまもなく利用可能になります。
             </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
