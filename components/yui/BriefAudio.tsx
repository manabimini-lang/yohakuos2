"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export function BriefAudio({ type }: { type: "morning" | "evening" }) {
  const [minutes, setMinutes] = useState(3);
  const [urls, setUrls] = useState<string[]>([]);
  const [scripts, setScripts] = useState<string[]>([]);
  const [part, setPart] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const player = useRef<HTMLAudioElement>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => { urls.filter(url => url.startsWith("blob:")).forEach(url => URL.revokeObjectURL(url)); }, [urls]);
  useEffect(() => () => { controller.current?.abort(); }, []);
  useEffect(() => {
    if (part > 0) void player.current?.play().catch(() => setError("再生ボタンで続きを聞けます。"));
  }, [part]);

  async function generate() {
    setBusy(true); setError("");
    controller.current = new AbortController();
    try {
      const response = await fetch("/api/yui/brief-audio", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, minutes }), signal: controller.current.signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "音声を生成できませんでした。");
      const audioIds: string[] = Array.isArray(data.audioIds)
        ? data.audioIds.filter((id: unknown): id is string => typeof id === "string")
        : [];
      setUrls(audioIds.map((id) => `/api/yui/audio/${encodeURIComponent(id)}`));
      setScripts(data.scripts); setPart(0);
      if (data.warning) setError(data.warning);
    } catch (e) {
      if (!controller.current?.signal.aborted) setError(e instanceof Error ? e.message : "音声を生成できませんでした。");
    } finally { setBusy(false); }
  }

  return <div className="mt-3 space-y-2">
    {scripts.length ? <>
      {urls.length > 0 && <audio ref={player} controls src={urls[part]} onEnded={() => { if (part + 1 < urls.length) setPart(part + 1); }} aria-label="今日の音声ブリーフ" className="w-full" />}
      {urls.length > 1 && <div className="flex gap-2">{urls.map((_, index) => <button type="button" key={index} onClick={() => setPart(index)} aria-pressed={part === index} className="rounded border px-2 py-1 text-xs">続き {index + 1}/{urls.length}</button>)}</div>}
      <details open={urls.length === 0} className="text-sm"><summary className="cursor-pointer">音声の原稿を読む</summary><p className="mt-2 whitespace-pre-wrap leading-7">{scripts.join("\n\n")}</p></details>
      {urls.length === 0 && <button type="button" disabled={busy} onClick={() => { setScripts([]); setError(""); }} className="rounded-full border px-3 py-2 text-xs">音声生成をもう一度試す</button>}
    </> : <>
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label="音声の長さ" disabled={busy} value={minutes} onChange={event => setMinutes(Number(event.target.value))} className="rounded border bg-white p-2 text-xs">
          <option value={1}>約1分</option><option value={3}>約3分</option><option value={5}>約5分</option>
        </select>
        <button type="button" disabled={busy} onClick={() => void generate()} className="rounded-full border border-sky-200 px-3 py-2 text-xs text-sky-800 disabled:opacity-50">{busy ? "記録をつなぎ、音声を準備中…" : "音声ブリーフを作る"}</button>
      </div>
      <p className="text-xs text-slate-500">Premium・AI利用枠を最大{minutes === 5 ? 5 : minutes + 1}回使用。材料に応じて短くなります。画面内での再生に追加生成はありません。</p>
    </>}
    {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
    {scripts.length > 0 && <Link href="/reflections" className="inline-block text-xs text-slate-500 underline underline-offset-4 hover:text-slate-700">
      保存済みの音声ブリーフを聞く
    </Link>}
  </div>;
}
