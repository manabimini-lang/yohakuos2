"use client";

import { useEffect, useState } from "react";

export function NewsletterPreference() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { fetch("/api/settings/newsletter").then((r) => r.json()).then((d) => setEnabled(Boolean(d.newsletterOptIn))).finally(() => setLoading(false)); }, []);
  async function update(value: boolean) {
    setSaving(true); setMessage("");
    const response = await fetch("/api/settings/newsletter", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newsletterOptIn: value }) });
    if (response.ok) { setEnabled(value); setMessage(value ? "配信を登録しました。" : "配信を停止しました。"); }
    else setMessage("設定を更新できませんでした。もう一度お試しください。");
    setSaving(false);
  }
  return <div className="flex items-start justify-between gap-4 px-4 py-4"><div><p className="font-medium text-[15px] text-slate-800">YOHAKUの情報を受け取る</p><p className="mt-1 text-xs leading-relaxed text-slate-500">製品の更新や学びのヒントをメールでお届けします。いつでも停止できます。</p>{message && <p className="mt-2 text-xs text-emerald-600">{message}</p>}</div><button type="button" disabled={loading || saving} onClick={() => update(!enabled)} aria-pressed={enabled} className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition ${enabled ? "bg-slate-900" : "bg-slate-200"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${enabled ? "left-6" : "left-1"}`} /></button></div>;
}
