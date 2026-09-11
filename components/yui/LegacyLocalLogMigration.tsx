"use client";

import { useEffect, useState } from "react";
import { getPersonalLogs, type PersonalLog } from "@/lib/utils/log-db";

const MIGRATION_KEY_PREFIX = "yohaku_yui_log_migrated:";

/** Copies retired browser-only logs into YUI while retaining the originals. */
export function LegacyLocalLogMigration() {
  const [pendingLogs, setPendingLogs] = useState<PersonalLog[]>([]);
  const [isMigrating, setIsMigrating] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function findPendingLogs() {
      const logs = await getPersonalLogs();
      setPendingLogs(logs.filter((log) => !localStorage.getItem(`${MIGRATION_KEY_PREFIX}${log.id}`)));
    }
    void findPendingLogs();
  }, []);

  async function migrate() {
    setIsMigrating(true);
    setMessage("");
    let imported = 0;
    try {
      for (const log of pendingLogs) {
        const response = await fetch("/api/yui/memories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "以前の記録",
            summary: log.content.slice(0, 180),
            body: log.content,
            importance: 3,
            tags: [...log.tags, log.road, `気分:${log.mood}`],
            source_type: "legacy_local_log",
          }),
        });

        if (!response.ok) throw new Error("Import failed");
        localStorage.setItem(`${MIGRATION_KEY_PREFIX}${log.id}`, "true");
        imported += 1;
      }
      setPendingLogs([]);
      setMessage(`${imported}件の記録をYUIへ移しました。元の記録もこの端末に残しています。`);
    } catch {
      setMessage(`${imported}件を移しました。残りはもう一度お試しください。`);
      const logs = await getPersonalLogs();
      setPendingLogs(logs.filter((log) => !localStorage.getItem(`${MIGRATION_KEY_PREFIX}${log.id}`)));
    } finally {
      setIsMigrating(false);
    }
  }

  if (!pendingLogs.length && !message) return null;

  return (
    <aside className="fixed inset-x-4 bottom-24 z-40 mx-auto max-w-xl rounded-2xl border border-sky-100 bg-white p-4 shadow-xl" aria-live="polite">
      {pendingLogs.length ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">以前の記録が{pendingLogs.length}件あります</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">この端末だけにある記録です。内容をYUIの記憶へ移すと、振り返りや提案に使えます。</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={() => setPendingLogs([])} className="rounded-full px-3 py-2 text-xs text-slate-500">今はしない</button>
            <button type="button" disabled={isMigrating} onClick={() => void migrate()} className="rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{isMigrating ? "移行中…" : "YUIへ移す"}</button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-slate-600">{message}</p>
          <button type="button" onClick={() => setMessage("")} className="text-xs text-slate-400">閉じる</button>
        </div>
      )}
    </aside>
  );
}
