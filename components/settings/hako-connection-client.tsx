"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Copy, MonitorSmartphone, RefreshCw, ShieldCheck } from "lucide-react";

type Device = { id: string; displayName: string; lastSeenAt: string | null; createdAt: string };

export function HakoConnectionClient() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [linkCode, setLinkCode] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = async () => {
    const response = await fetch("/api/hako/link-codes", { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "HAKOの状態を取得できませんでした");
    setDevices(body.devices || []);
  };
  useEffect(() => { refresh().catch((error) => setNotice(error.message)); }, []);
  const issue = async () => {
    setBusy(true); setNotice("");
    try {
      const response = await fetch("/api/hako/link-codes", { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "リンクコードを作れませんでした");
      setLinkCode(body.code); setExpiresAt(body.expiresAt);
    } catch (error) { setNotice(error instanceof Error ? error.message : "リンクコードを作れませんでした"); }
    finally { setBusy(false); }
  };
  const copy = async () => { await navigator.clipboard.writeText(linkCode); setNotice("リンクコードをコピーしました"); };
  return <div className="min-h-screen bg-[#f5f5f7]"><main className="mx-auto max-w-[720px] space-y-8 px-4 py-12 pb-32">
    <header className="flex items-center justify-between gap-3 px-2"><div><p className="text-sm text-slate-500">YUIの設定</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">HAKOと接続</h1></div><Link href="/yui/settings#connections" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"><ArrowLeft className="h-4 w-4" />YUIの設定へ</Link></header>
    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"><div className="flex gap-4"><div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><MonitorSmartphone className="h-6 w-6" /></div><div><h2 className="text-lg font-semibold text-slate-900">自分のHAKOだけをつなぐ</h2><p className="mt-2 text-sm leading-6 text-slate-600">YOHAKUOS2のアカウントと、このMacのHAKO Companionを一度だけ結びます。HAKOへ送る予定やタスクの範囲は、次のHAKO連携で確認します。</p></div></div></section>
    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"><h2 className="text-lg font-semibold text-slate-900">1. Companionを登録する</h2><p className="mt-2 text-sm leading-6 text-slate-600">リンクコードを作ったら、このMacで <code className="rounded bg-slate-100 px-1.5 py-0.5">http://127.0.0.1:8766</code> を開きます。「あなたのアカウントとつなぐ」に、YOHAKUOS2の公開URL・このコード・HAKOの名前を入力してください。</p>{linkCode ? <div className="mt-5 rounded-2xl bg-slate-50 p-5"><p className="text-xs font-medium text-slate-500">10分間有効なリンクコード</p><div className="mt-2 flex items-center justify-between gap-3"><code className="text-2xl font-semibold tracking-[0.18em] text-slate-900">{linkCode}</code><button onClick={copy} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600" aria-label="コピー"><Copy className="h-5 w-5" /></button></div><p className="mt-3 text-xs text-slate-500">有効期限: {new Date(expiresAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</p></div> : <button onClick={issue} disabled={busy} className="mt-5 rounded-2xl bg-emerald-700 px-4 py-3 font-medium text-white disabled:opacity-40">{busy ? "作成しています…" : "リンクコードを作る"}</button>}</section>
    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold text-slate-900">2. HAKOを連携する</h2><p className="mt-2 text-sm leading-6 text-slate-600">Companion登録後、HAKOでYOHAKUOS2を選び、6桁コードをCompanionへ入力します。</p></div><ShieldCheck className="h-6 w-6 text-slate-400" /></div></section>
    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-900">接続済みのHAKO</h2><button onClick={() => refresh().catch((error) => setNotice(error.message))} className="rounded-xl p-2 text-slate-500" aria-label="更新"><RefreshCw className="h-5 w-5" /></button></div>{devices.length ? <ul className="mt-4 space-y-3">{devices.map((device) => <li key={device.id} className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900"><CheckCircle2 className="h-5 w-5" /><div><p>{device.displayName}</p><p className="mt-1 text-xs text-emerald-700">{device.lastSeenAt ? `最終確認 ${new Date(device.lastSeenAt).toLocaleString("ja-JP")}` : "接続確認待ち"}</p></div></li>)}</ul> : <p className="mt-4 text-sm text-slate-500">まだHAKOは登録されていません。</p>}</section>
    {notice && <p className="px-2 text-sm text-slate-600" role="status">{notice}</p>}
  </main></div>;
}
