"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { 
  User, Mail, LogOut, 
  Moon, Bell, Monitor,
  Sparkles, Layers,
  Download, Database, Trash2,
  Info, FileText, ShieldCheck,
  ChevronRight, MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-[13px] font-medium text-slate-500 pl-4">{title}</h2>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
        {children}
      </div>
    </section>
  );
}

function Item({ icon: Icon, label, value, onClick, href, isDanger }: any) {
  const content = (
    <>
      <div className="flex items-center space-x-3">
        <div className={cn("p-2 rounded-xl", isDanger ? "bg-red-50 text-red-500" : "bg-slate-50 text-slate-500")}>
          <Icon className="w-[18px] h-[18px]" />
        </div>
        <span className={cn("font-medium text-[15px]", isDanger ? "text-red-600" : "text-slate-800")}>
          {label}
        </span>
      </div>
      <div className="flex items-center space-x-2">
        {value && <span className="text-sm text-slate-400">{value}</span>}
        {href && <ChevronRight className="w-4 h-4 text-slate-300" />}
      </div>
    </>
  );

  const className = "flex items-center justify-between px-4 py-3 bg-white active:bg-slate-50 transition-colors w-full text-left";

  if (href) {
    return <Link href={href} className={className}>{content}</Link>;
  }

  return <button onClick={onClick} className={className}>{content}</button>;
}

function Divider() {
  return <div className="h-px bg-slate-100 w-full ml-[60px]" />;
}

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="mx-auto max-w-[720px] px-4 py-12 pb-32 space-y-10">
        
        <header className="px-2">
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">設定</h1>
        </header>

        <Section title="あなた">
          <Item 
            icon={Mail} 
            label="メールアドレス" 
            value={session?.user?.email || "未設定"} 
          />
          <Divider />
          <Item 
            icon={User} 
            label="プロフィール" 
            href="/profile" 
          />
          <Divider />
          <Item 
            icon={MessageSquare} 
            label="外部サービス連携" 
            href="/settings/account" 
          />
          <Divider />
          <Item 
            icon={LogOut} 
            label="ログアウト" 
            onClick={() => signOut({ callbackUrl: "/" })}
            isDanger
          />
        </Section>

        <Section title="環境">
          <Item 
            icon={Moon} 
            label="ダークモード" 
            value="システムに依存"
            onClick={() => alert("ダークモード設定は準備中です")}
          />
          <Divider />
          <Item 
            icon={Bell} 
            label="通知" 
            onClick={() => alert("通知設定は準備中です")}
          />
          <Divider />
          <Item 
            icon={Monitor} 
            label="表示設定" 
            onClick={() => alert("表示設定は準備中です")}
          />
        </Section>

        <Section title="伴走AI">
          <Item 
            icon={Sparkles} 
            label="AI応答設定" 
            href="/settings/ai" 
          />
          <Divider />
          <Item 
            icon={Layers} 
            label="レイヤー設定" 
            onClick={() => alert("レイヤー設定は準備中です")}
          />
        </Section>

        <Section title="記録">
          <Item 
            icon={Download} 
            label="エクスポート" 
            onClick={() => alert("エクスポート機能は準備中です")}
          />
          <Divider />
          <Item 
            icon={Database} 
            label="バックアップ" 
            href="/settings/data" 
          />
          <Divider />
          <Item 
            icon={Trash2} 
            label="削除" 
            isDanger
            onClick={() => alert("データ削除は現在リクエストベースで対応しています")}
          />
        </Section>

        <Section title="この余白について">
          <Item 
            icon={Info} 
            label="バージョン" 
            value="v1.0.0" 
            onClick={() => {}}
          />
          <Divider />
          <Item 
            icon={FileText} 
            label="利用規約" 
            href="/terms" 
          />
          <Divider />
          <Item 
            icon={ShieldCheck} 
            label="プライバシーポリシー" 
            href="/privacy" 
          />
        </Section>

      </div>
    </div>
  );
}
