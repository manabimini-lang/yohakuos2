"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { 
  getCurrentRoad, 
  setCurrentRoad, 
  getPersonalLogs, 
  PersonalLog 
} from "@/lib/utils/log-db";
import { getSecureApiKeyStatus } from "@/lib/utils/secure-storage";
import { 
  Sparkles, 
  Route, 
  Calendar, 
  Key, 
  Settings, 
  ChevronLeft, 
  CreditCard,
  User,
  Activity,
  MessageSquare,
  Database
} from "lucide-react";

const DEFAULT_ROADS = [
  { id: "beginner", slug: "beginner", title: "初任者ロード", icon: "🌱" },
  { id: "side-hustle", slug: "side-hustle", title: "副業ロード", icon: "💻" },
  { id: "resignation", slug: "resignation", title: "退職ロード", icon: "🚪" },
];

export function ProfileClient() {
  const { data: session } = useSession();
  const [roads, setRoads] = useState<any[]>(DEFAULT_ROADS);
  const [logs, setLogs] = useState<PersonalLog[]>([]);
  const [currentRoadId, setCurrentRoadId] = useState("beginner");
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfileData() {
      try {
        const road = await getCurrentRoad();
        setCurrentRoadId(road);

        const personalLogs = await getPersonalLogs();
        setLogs(personalLogs);

        const geminiStatus = await getSecureApiKeyStatus("gemini");
        setHasGeminiKey(geminiStatus);

        const res = await fetch("/api/roads");
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            const mapped = data.map((r: any) => ({
              id: r.slug,
              slug: r.slug,
              title: r.title,
              icon: r.icon
            }));
            setRoads(mapped);
          }
        }
      } catch (err) {
        console.error("Failed to load profile data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfileData();
  }, []);

  const handleRoadChange = async (roadId: string) => {
    try {
      await setCurrentRoad(roadId);
      setCurrentRoadId(roadId);
    } catch (error) {
      console.error("Failed to change road:", error);
    }
  };

  // Calculate Streak
  const calculateStreak = (logsList: PersonalLog[]): number => {
    if (logsList.length === 0) return 0;
    
    const dates = Array.from(
      new Set(
        logsList.map(log => {
          const d = new Date(log.created_at);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        })
      )
    ).sort((a, b) => b - a);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const yesterdayMs = yesterday.getTime();

    if (dates[0] !== todayMs && dates[0] !== yesterdayMs) {
      return 0;
    }
    
    let streak = 0;
    let expectedMs = dates[0];
    
    for (let i = 0; i < dates.length; i++) {
      if (dates[i] === expectedMs) {
        streak++;
        expectedMs -= 24 * 60 * 60 * 1000;
      } else {
        break;
      }
    }
    return streak;
  };

  // Count Logs This Month
  const countThisMonthLogs = (logsList: PersonalLog[]): number => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return logsList.filter(log => log.created_at >= startOfMonth).length;
  };

  const streak = calculateStreak(logs);
  const thisMonthLogsCount = countThisMonthLogs(logs);
  const plan = session?.user && (session.user as any).plan === "premium" ? "Premium" : "Free";
  const roadTitle = roads.find(r => r.id === currentRoadId)?.title || "未設定";

  return (
    <div className="mx-auto max-w-xl px-6 py-12 md:py-24 space-y-12 selection:bg-slate-100">
      {/* Back to dashboard */}
      <div>
        <Link 
          href="/dashboard" 
          className="inline-flex items-center text-xs text-muted-foreground hover:text-slate-650 transition-colors font-mono"
        >
          <ChevronLeft className="w-3.5 h-3.5 mr-1" />
          Dashboard
        </Link>
      </div>

      {/* Main Profile Header */}
      <div className="space-y-4 text-center sm:text-left pb-6 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4">
          <div className="space-y-1.5 text-center sm:text-left">
            <h1 className="text-2xl font-serif text-slate-850 tracking-wide inline-flex items-center gap-2">
              <User className="w-6 h-6 text-muted-foreground stroke-[1.5]" />
              <span>{session?.user?.name || "メンバー"}</span>
            </h1>
            <p className="text-xs text-muted-foreground font-mono">
              {session?.user?.email || "anonymous@yohaku.space"}
            </p>
          </div>

          <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-medium tracking-wider border ${
            plan === "Premium" 
              ? "text-foreground bg-slate-900/5 border-slate-900/10 font-bold" 
              : "text-muted-foreground bg-slate-50 border-slate-100"
          }`}>
            <Sparkles className="w-3 h-3 stroke-[2]" />
            <span>{plan} Plan</span>
          </span>
        </div>
      </div>

      {/* Stats Block (Obsidian-like cards) */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">自分の現在地</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Active Road */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-2.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-mono tracking-wider uppercase">Current Road</span>
              <Route className="w-4 h-4 stroke-[1.5]" />
            </div>
            <p className="text-sm font-medium text-foreground">{roadTitle}</p>
          </div>

          {/* Continuous Days */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-2.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-mono tracking-wider uppercase">Active Streak</span>
              <Activity className="w-4 h-4 stroke-[1.5]" />
            </div>
            <p className="text-sm font-medium text-foreground">
              <span className="text-base font-serif mr-1">{streak}</span>
              <span className="text-xs text-slate-450">日連続</span>
            </p>
          </div>

          {/* Logs count */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-2.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-mono tracking-wider uppercase">Logs This Month</span>
              <Calendar className="w-4 h-4 stroke-[1.5]" />
            </div>
            <p className="text-sm font-medium text-foreground">
              <span className="text-base font-serif mr-1">{thisMonthLogsCount}</span>
              <span className="text-xs text-slate-450">回記録</span>
            </p>
          </div>

          {/* Gemini connection status */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-2.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] font-mono tracking-wider uppercase">Gemini Connect</span>
              <Key className="w-4 h-4 stroke-[1.5]" />
            </div>
            <p className="text-sm font-medium text-foreground flex items-center space-x-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${hasGeminiKey ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}></span>
              <span className="text-xs">{hasGeminiKey ? "接続中" : "未接続"}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Road Switcher (Inline Notion-like Selector) */}
      <div className="space-y-4 pt-4 border-t border-slate-50">
        <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">ロードの切り替え</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          {roads.map((r) => (
            <button
              key={r.id}
              onClick={() => handleRoadChange(r.id)}
              className={`flex-1 text-left px-4 py-3 rounded-xl border text-xs transition-all duration-300 ${
                currentRoadId === r.id
                  ? "border-slate-800 bg-slate-900 text-foreground font-medium shadow-sm"
                  : "border-slate-100 bg-white text-slate-600 hover:border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{r.icon} {r.title}</span>
                {currentRoadId === r.id && (
                  <span className="text-[9px] font-mono tracking-wider text-muted-foreground">Selected</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Settings Navigation Section */}
      <div className="space-y-4 pt-6 border-t border-slate-50">
        <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">空間を整える</h2>
        <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl bg-white overflow-hidden text-xs">
          {/* Gemini Key Config */}
          <Link 
            href="/member/settings"
            className="flex items-center justify-between p-4 text-slate-650 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center space-x-2.5">
              <Key className="w-4 h-4 text-muted-foreground stroke-[1.5]" />
              <span>AI（Gemini API）の接続設定</span>
            </div>
            <ChevronLeft className="w-3.5 h-3.5 rotate-180 text-slate-350" />
          </Link>

          {/* Discord Connection Settings */}
          <Link 
            href="/member/settings"
            className="flex items-center justify-between p-4 text-slate-650 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center space-x-2.5">
              <MessageSquare className="w-4 h-4 text-muted-foreground stroke-[1.5]" />
              <span>Discord アカウント連携設定</span>
            </div>
            <ChevronLeft className="w-3.5 h-3.5 rotate-180 text-slate-350" />
          </Link>

          {/* Premium Billing Settings */}
          <Link 
            href="/pricing"
            className="flex items-center justify-between p-4 text-slate-655 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center space-x-2.5">
              <CreditCard className="w-4 h-4 text-muted-foreground stroke-[1.5]" />
              <span>Premium 加入管理 / プランの変更</span>
            </div>
            <ChevronLeft className="w-3.5 h-3.5 rotate-180 text-slate-350" />
          </Link>

          {/* Local Data Management */}
          <Link 
            href="/member/settings"
            className="flex items-center justify-between p-4 text-slate-650 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center space-x-2.5">
              <Database className="w-4 h-4 text-muted-foreground stroke-[1.5]" />
              <span>データ管理（バックアップ）</span>
            </div>
            <ChevronLeft className="w-3.5 h-3.5 rotate-180 text-slate-350" />
          </Link>

          {/* General App Settings */}
          <Link 
            href="/member/settings"
            className="flex items-center justify-between p-4 text-slate-650 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center space-x-2.5">
              <Settings className="w-4 h-4 text-muted-foreground stroke-[1.5]" />
              <span>その他の設定</span>
            </div>
            <ChevronLeft className="w-3.5 h-3.5 rotate-180 text-slate-350" />
          </Link>
        </div>
      </div>
    </div>
  );
}
