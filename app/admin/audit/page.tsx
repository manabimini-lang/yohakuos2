import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { extractPermissionsFromSession, hasMinRoleLevel } from "@/lib/permissions/helpers";
import { AuditAdminView } from "@/components/admin/audit-view";
import { queryAuditLogs, getAuditSummary } from "@/core/audit/logger";
import type { AuditQuery } from "@/core/audit/types";

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const extracted = extractPermissionsFromSession(session);
  if (!extracted || !hasMinRoleLevel(extracted.roles, "admin")) {
    redirect("/member");
  }

  // Parse query params
  const query: AuditQuery = {
    category: (searchParams.category as any) || "all",
    severity: (searchParams.severity as any) || "all",
    actorId: searchParams.actorId,
    action: searchParams.action,
    targetType: searchParams.targetType,
    fromDate: searchParams.fromDate,
    toDate: searchParams.toDate,
    search: searchParams.search,
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    pageSize: 50,
  };

  const [result, summary] = await Promise.all([
    queryAuditLogs(query),
    getAuditSummary(7),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">監査ログ</h1>
        <div className="text-xs text-slate-400">
          {result.total} 件のイベント
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <SummaryCard label="認証" count={summary.byCategory.auth ?? 0} color="text-blue-600" />
        <SummaryCard label="セキュリティ" count={summary.byCategory.security ?? 0} color="text-red-600" />
        <SummaryCard label="管理操作" count={summary.byCategory.admin ?? 0} color="text-purple-600" />
        <SummaryCard label="モデレーション" count={summary.byCategory.moderation ?? 0} color="text-amber-600" />
      </div>

      {/* Recent Errors Alert */}
      {summary.recentErrors.length > 0 && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">
            最近7日間で {summary.recentErrors.length} 件のエラー/重大イベント
          </p>
        </div>
      )}

      {/* Audit Log Table */}
      <AuditAdminView
        records={result.records}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        currentCategory={query.category ?? "all"}
        currentSeverity={query.severity ?? "all"}
      />
    </div>
  );
}

function SummaryCard({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${color}`}>{count}</p>
    </div>
  );
}