import { prisma } from "@/lib/prisma";
import { PLAN } from "@/lib/constants/plan";

/**
 * データ保持期限を返す。
 * - Premium: null（永続保存）
 * - Free（またはユーザーが見つからない場合）: 現在時刻 + 7日
 *
 * 課金状態はサブスクリプションのステータスを正とし、
 * ユーザーの plan フィールドで判定する。
 * Role は権限管理に留め、課金判定には使用しない。
 */
export async function getExpiresAt(userId: string): Promise<Date | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  // plan === "premium" のユーザーのみ永続保存
  if (user?.plan === PLAN.PREMIUM) {
    return null;
  }

  // 無料 or 不明は7日間
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}
