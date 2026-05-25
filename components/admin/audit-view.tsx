"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import type { AuditRecord } from "@/core/audit/types";

type Props = {
  records: AuditRecord[];
  total: number;
  page: number;
  totalPages: number;
  currentCategory: string;
  currentSeverity: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  auth: "認証",
  moderation: "モデレーション",
  billing: "課金",
  ai: "AI",
  admin: "管理",
  security: "セキュリティ",
  user_management: "ユーザー管理",
};

const SEVERITY_STYLES: Record<string, string> = {
  info: "bg-slate-100 text-slate-600",
  warning: "bg-amber-50 text-amber-600",
  error: "bg-red-50 text-red-600",
  critical: "bg-red-100 text-red-700",
};

const SEVERITY_LABELS: Record<string, string> = {
  info: "INFO",
  warning: "WARN",
  error: "ERROR",
  critical: "CRITICAL",
};

export function AuditAdminView({
  records,
  total,
  page,
  totalPages,
  currentCategory,
  currentSeverity,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.set("page", "1");
      router.push(`/admin/audit?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={currentCategory}
          onChange={(e) => updateFilter("category", e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
        >
          <option value="all">すべてのカテゴリ</option>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={currentSeverity}
          onChange={(e) => updateFilter("severity", e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
        >
          <option value="all">すべての重要度</option>
          {Object.entries(SEVERITY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        <button
          onClick={() => router.push("/admin/audit")}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 hover:bg-slate-50"
        >
          リセット
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-100">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-4 py-3 font-medium text-slate-500">日時</th>
              <th className="px-4 py-3 font-medium text-slate-500">重要度</th>
              <th className="px-4 py-3 font-medium text-slate-500">カテゴリ</th>
              <th className="px-4 py-3 font-medium text-slate-500">アクション</th>
              <th className="px-4 py-3 font-medium text-slate-500">アクター</th>
              <th className="px-4 py-3 font-medium text-slate-500">ターゲット</th>
              <th className="px-4 py-3 font-medium text-slate-500">IP</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  監査イベントがありません
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr
                  key={record.id}
                  className="border-b border-slate-50 transition-colors hover:bg-slate-50"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                    {new Date(record.createdAt).toLocaleString("ja-JP", {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-medium ${
                        SEVERITY_STYLES[record.severity] ?? SEVERITY_STYLES.info
                      }`}
                    >
                      {SEVERITY_LABELS[record.severity] ?? record.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {CATEGORY_LABELS[record.category] ?? record.category}
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 font-mono text-slate-700">
                    {record.action}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {record.actorEmail ?? record.actorId ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {record.targetType ? (
                      <span>
                        {record.targetType}:{record.targetId?.slice(0, 8)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400">
                    {record.ipAddress ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() =>
              router.push(
                `/admin/audit?${new URLSearchParams({
                  ...Object.fromEntries(searchParams.entries()),
                  page: String(page - 1),
                }).toString()}`,
              )
            }
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 disabled:opacity-30"
          >
            前へ
          </button>
          <span className="text-xs text-slate-400">
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() =>
              router.push(
                `/admin/audit?${new URLSearchParams({
                  ...Object.fromEntries(searchParams.entries()),
                  page: String(page + 1),
                }).toString()}`,
              )
            }
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 disabled:opacity-30"
          >
            次へ
          </button>
        </div>
      )}

      {/* Total */}
      <div className="text-center text-[10px] text-slate-400">
        全{total}件
      </div>
    </div>
  );
}