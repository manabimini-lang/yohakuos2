import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdminAccessEmail } from '@/lib/auth/admin-access';
import { extractPermissionsFromSession, hasMinRoleLevel } from '@/lib/permissions/helpers';

export const dynamic = 'force-dynamic';

export default async function AcquisitionPage() {
  const session = await auth();
  const permissions = session ? extractPermissionsFromSession(session) : null;
  if (!session?.user || !isAdminAccessEmail(session.user.email) || !permissions || !hasMinRoleLevel(permissions.roles, 'admin')) redirect('/login');
  const since = new Date(Date.now() - 30 * 86400000);
  const records = await prisma.auditLog.findMany({
    where: { category: 'product_funnel', createdAt: { gte: since } },
    select: { action: true, metadata: true }, take: 10001,
    orderBy: { createdAt: 'desc' },
  });
  const totals = new Map<string, { signups: number; firstValues: number; initial: number; renewals: number; other: number; money: Map<string, number> }>();
  for (const record of records.slice(0, 10000)) {
    const meta = record.metadata as Record<string, unknown> | null;
    const source = typeof meta?.source_article === 'string' ? meta.source_article : 'unattributed';
    const row = totals.get(source) || { signups: 0, firstValues: 0, initial: 0, renewals: 0, other: 0, money: new Map<string, number>() };
    if (record.action === 'signup_completed') row.signups++;
    if (record.action === 'first_value_completed') row.firstValues++;
    if (record.action === 'payment_succeeded') {
      if (meta?.payment_kind === 'initial') row.initial++;
      else if (meta?.payment_kind === 'renewal') row.renewals++;
      else row.other++;
      if (typeof meta?.currency === 'string' && typeof meta?.amount_minor === 'number') {
        row.money.set(meta.currency, (row.money.get(meta.currency) || 0) + meta.amount_minor);
      }
    }
    totals.set(source, row);
  }
  return <section className="space-y-6">
    <h1 className="text-2xl font-semibold">記事からの登録・利用・決済</h1>
    <p className="text-sm text-slate-600">過去30日間に発生した確定イベントです。登録者の同一集団を追う転換率ではありません。移動元は登録時の記事で固定されます。</p>
    <p className="text-sm text-slate-600">初回利用は、計測開始後に提案を採用して目標またはマイルストーンを実際に保存した最初の1回。仮実装の成功表示、ページ閲覧、操作失敗は数えません。</p>
    {records.length > 10000 && <p className="text-amber-700">件数が多いため直近10,000件のみを表示しています。全件集計ではありません。</p>}
    {!totals.size ? <p>まだ計測データがありません。公開後に発生した成功イベントから記録します。</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm">
      <thead><tr>{['登録時の記事', '登録完了', '初回利用', '初回決済', '継続決済', 'その他決済', '入金額（通貨の最小単位）'].map(label => <th key={label} className="border-b p-3">{label}</th>)}</tr></thead>
      <tbody>{[...totals.entries()].map(([source, row]) => <tr key={source}>
        <td className="border-b p-3 break-all">{source === 'unattributed' ? '移動元不明・直接登録' : source}</td>
        {[row.signups, row.firstValues, row.initial, row.renewals, row.other].map((value, index) => <td className="border-b p-3" key={index}>{value}</td>)}
        <td className="border-b p-3">{[...row.money].map(([currency, amount]) => `${currency.toUpperCase()} ${amount.toLocaleString()}`).join(' / ') || '—'}</td>
      </tr>)}</tbody>
    </table></div>}
    <p className="text-xs text-slate-500">JPYは円、USDはセント単位です。決済通知は請求書IDで重複排除します。0円・失敗・未決済は除外。返金・手数料を控除した利益ではありません。記事閲覧・クリックはメディア側のVercel Analyticsで同じ記事識別情報と比較してください。</p>
  </section>;
}
