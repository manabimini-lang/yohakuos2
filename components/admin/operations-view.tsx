"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { QueueHealth } from "@/core/queue/types";

type Props = {
  health: QueueHealth;
  pendingCount: number;
  failedCount: number;
};

export function OperationsAdminView({ health, pendingCount, failedCount }: Props) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleProcessAll = async () => {
    setIsProcessing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/operations/process", { method: "POST" });
      const data = await res.json();
      setMessage(`${data.processed}件のジョブを処理しました`);
      router.refresh();
    } catch {
      setMessage("処理に失敗しました");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetryAll = async () => {
    setIsRetrying(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/operations/retry", { method: "POST" });
      const data = await res.json();
      setMessage(`${data.retried}件のジョブを再試行しました`);
      router.refresh();
    } catch {
      setMessage("再試行に失敗しました");
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="space-y-4">
      {message && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          {message}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleProcessAll}
          disabled={isProcessing || pendingCount === 0}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        >
          {isProcessing ? "処理中..." : "未処理ジョブを実行"}
        </button>

        <button
          onClick={handleRetryAll}
          disabled={isRetrying || failedCount === 0}
          className="rounded-lg border border-amber-200 bg-white px-4 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-40"
        >
          {isRetrying ? "再試行中..." : "失敗ジョブを再試行"}
        </button>
      </div>

      {/* Job Types Table */}
      <div className="overflow-hidden rounded-xl border border-slate-100">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-4 py-3 font-medium text-muted-foreground">ジョブタイプ</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">件数</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">ステータス</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(health.byJobType).length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                  キューにジョブがありません
                </td>
              </tr>
            ) : (
              Object.entries(health.byJobType).map(([jobType, count]) => (
                <tr key={jobType} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-slate-700">{jobType}</td>
                  <td className="px-4 py-3 text-muted-foreground">{count}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {count > 0 ? "アクティブ" : "アイドル"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}