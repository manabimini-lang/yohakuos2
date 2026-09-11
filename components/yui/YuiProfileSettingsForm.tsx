"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { Card } from "@/components/ui/card";
import type { YuiProfileSettings } from "@/app/ui/backend/yui/models";

const defaults: YuiProfileSettings = {
  display_name: "", assistant_name: "YUI", tone: "gentle", life_theme: "", focus_area: "",
  notification_strength: "normal", summary_frequency: "daily", timezone: "Asia/Tokyo",
};

export function YuiProfileSettingsForm() {
  const [form, setForm] = useState<YuiProfileSettings>(defaults);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/yui/profile").then(async (response) => {
      if (!response.ok) throw new Error("プロフィールを取得できませんでした");
      const { profile } = await response.json();
      setForm((current) => ({
        ...current,
        display_name: profile?.display_name ?? "", assistant_name: profile?.assistant_name ?? "YUI",
        tone: profile?.tone ?? "gentle", life_theme: profile?.life_theme ?? "", focus_area: profile?.focus_area ?? "",
        notification_strength: String(profile?.notification_settings?.strength ?? "normal"),
        summary_frequency: String(profile?.notification_settings?.summary_frequency ?? "daily"),
        timezone: String(profile?.preferences?.timezone ?? "Asia/Tokyo"),
      }));
    }).catch((error) => setMessage(error instanceof Error ? error.message : "プロフィールを取得できませんでした"));
  }, []);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setIsSaving(true); setMessage(null);
    try {
      const response = await fetch("/api/yui/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? "プロフィールの保存に失敗しました");
      setMessage("プロフィールを保存しました。");
    } catch (error) { setMessage(error instanceof Error ? error.message : "プロフィールの保存に失敗しました"); }
    finally { setIsSaving(false); }
  };

  const fields: Array<[keyof YuiProfileSettings, string, string]> = [
    ["display_name", "表示名", "表示名"], ["assistant_name", "アシスタント名", "YUI"],
    ["life_theme", "人生のテーマ", "今の人生テーマ"], ["focus_area", "注力したいこと", "いま注力したいこと"], ["timezone", "タイムゾーン", "Asia/Tokyo"],
  ];
  return <Card className="space-y-4 p-6">
    <div><p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">プロフィール</p><h2 className="mt-1 text-lg font-semibold">YUIのプロフィール</h2></div>
    <form onSubmit={save} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">{fields.map(([key, label, placeholder]) => <label key={key} className="space-y-2"><span className="text-xs text-muted-foreground">{label}</span><input value={String(form[key] ?? "")} onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))} placeholder={placeholder} className="yohaku-input" /></label>)}</div>
      <div className="grid gap-4 md:grid-cols-3"><label className="space-y-2"><span className="text-xs text-muted-foreground">話し方</span><select value={form.tone} onChange={(e) => setForm((c) => ({ ...c, tone: e.target.value }))} className="yohaku-input"><option value="gentle">やさしく寄り添う</option><option value="friendly">親しみやすく話す</option><option value="concise">簡潔に伝える</option></select></label><label className="space-y-2"><span className="text-xs text-muted-foreground">通知強度</span><select value={form.notification_strength} onChange={(e) => setForm((c) => ({ ...c, notification_strength: e.target.value }))} className="yohaku-input"><option value="low">控えめ</option><option value="normal">標準</option><option value="high">しっかり</option></select></label><label className="space-y-2"><span className="text-xs text-muted-foreground">要約頻度</span><select value={form.summary_frequency} onChange={(e) => setForm((c) => ({ ...c, summary_frequency: e.target.value }))} className="yohaku-input"><option value="daily">毎日</option><option value="weekly">毎週</option><option value="monthly">毎月</option></select></label></div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={isSaving} className="yohaku-btn">{isSaving ? "保存中..." : "プロフィールを保存"}</button>
        <button type="button" onClick={() => void signOut({ callbackUrl: "/login" })} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">ログアウト</button>
      </div>
    </form>
    {message && <p className="text-sm text-muted-foreground">{message}</p>}
  </Card>;
}
