import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { extractPermissionsFromSession, hasMinRoleLevel } from "@/lib/permissions/helpers";
import { OperationsAdminView } from "@/components/admin/operations-view";
import { queue } from "@/services/queue";

export default async function AdminOperationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const extracted = extractPermissionsFromSession(session);
  if (!extracted || !hasMinRoleLevel(extracted.roles, "admin")) {
    redirect("/member");
  }

  const [health, pendingCount, failedCount] = await Promise.all([
    queue.getHealth(),
    queue.getPendingCount(),
    queue.getFailedCount(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">オペレーション</h1>
        <div className="text-xs text-muted-foreground">
          キュー状態
        </div>
      </div>

      {/* Queue Status Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
        <StatusCard label="Pending" count={health.pending} color="text-blue-600" />
        <StatusCard label="Running" count={health.running} color="text-amber-600" />
        <StatusCard label="Completed" count={health.completed} color="text-emerald-600" />
        <StatusCard label="Failed" count={health.failed} color="text-red-600" />
        <StatusCard label="Total Jobs" count={health.totalJobs} color="text-slate-600" />
      </div>

      {/* Health Alert */}
      {health.failed > 0 && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">
            {health.failed}件の失敗ジョブがあります。デッドレターキューを確認してください。
          </p>
        </div>
      )}

      {/* Job Type Breakdown */}
      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-medium text-slate-700">ジョブタイプ別</h2>
        <div className="space-y-2">
          {Object.entries(health.byJobType).length === 0 ? (
            <p className="text-xs text-muted-foreground">ジョブがありません</p>
          ) : (
            Object.entries(health.byJobType).map(([jobType, count]) => (
              <div key={jobType} className="flex items-center justify-between text-xs">
                <span className="font-mono text-slate-600">{jobType}</span>
                <span className="text-muted-foreground">{count}件</span>
              </div>
            ))
          )}
        </div>
      </div>

      <OperationsAdminView
        health={health}
        pendingCount={pendingCount}
        failedCount={failedCount}
      />
    </div>
  );
}

function StatusCard({
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
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${color}`}>{count}</p>
    </div>
  );
}