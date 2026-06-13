"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  CreditCard, 
  ExternalLink, 
  Mail, 
  Info,
  AlertTriangle,
  CheckCircle2,
  DollarSign
} from "lucide-react";
import { getAdminBillingList, getAdminStripePortalUrl } from "@/app/admin/actions";

type BillingItem = {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  status: string;
  stripePriceId: string | null;
  plan: string;
  currentPeriodEnd: Date | null;
};

export default function BillingPage() {
  const [billingList, setBillingList] = useState<BillingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [redirectingId, setRedirectingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    loadBilling();
  }, []);

  const loadBilling = async () => {
    try {
      setLoading(true);
      const data = await getAdminBillingList();
      setBillingList(data as any);
    } catch (e) {
      console.error(e);
      showToast("課金情報の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenPortal = async (customerId: string | null, subId: string) => {
    if (!customerId) {
      showToast("StripeカスタマーIDが存在しません");
      return;
    }
    if (redirectingId) return;

    setRedirectingId(subId);
    try {
      const portalUrl = await getAdminStripePortalUrl(customerId);
      window.open(portalUrl, "_blank");
    } catch (e) {
      console.error(e);
      showToast("Stripeポータルの生成に失敗しました");
    } finally {
      setRedirectingId(null);
    }
  };

  // Determine if a subscription requires attention
  const isSuspicious = (item: BillingItem) => {
    if (["past_due", "unpaid", "canceled"].includes(item.status)) {
      return true;
    }
    if (item.status === "trialing" && item.currentPeriodEnd) {
      const threeDaysLater = new Date();
      threeDaysLater.setDate(threeDaysLater.getDate() + 3);
      return new Date(item.currentPeriodEnd) <= threeDaysLater;
    }
    return false;
  };

  const filteredBilling = billingList.filter(b => 
    (b.userName?.toLowerCase().includes(search.toLowerCase()) || false) || 
    b.userEmail.toLowerCase().includes(search.toLowerCase()) ||
    (b.stripeCustomerId?.toLowerCase().includes(search.toLowerCase()) || false)
  );

  const suspiciousList = filteredBilling.filter(isSuspicious);
  const normalList = filteredBilling.filter(item => !isSuspicious(item));

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-muted-foreground space-y-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800" />
        <span className="text-xs">読み込み中...</span>
      </div>
    );
  }

  return (
    <section className="space-y-6 max-w-5xl mx-auto">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-foreground shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-300">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">課金管理</h1>
          <p className="mt-1 text-sm text-slate-600">
            Stripeサブスクリプション状況を監視します。プランの変更や個別のお支払い処理はStripe上で行います。
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="ユーザー名、メール、Stripe ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800 bg-slate-50/50"
          />
        </div>
      </header>

      {/* Stripe Source of Truth Notice */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-slate-700">請求ロジックの管理基準</h4>
          <p className="text-xs text-muted-foreground leading-normal">
            YOHAKU OS2はStripeを唯一の「Source of Truth（信頼できる情報源）」としています。請求処理・顧客情報の変更・解約手続きは安全性の観点からStripe Customer Portalで行い、ローカルでの個別請求処理は行いません。
          </p>
        </div>
      </div>

      {/* suspicious list (Attention Required) */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">要確認契約</h3>
        {suspiciousList.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-muted-foreground flex items-center justify-center gap-2 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <p className="text-xs font-medium">確認が必要な契約はありません。すべて順調に推移しています。</p>
          </div>
        ) : (
          <div className="bg-white border border-amber-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-amber-50/40 border-b border-amber-100 text-xs font-medium text-amber-800 uppercase tracking-wider">
                    <th className="px-6 py-4">顧客 / ユーザー</th>
                    <th className="px-6 py-4">Stripeステータス</th>
                    <th className="px-6 py-4">現在のプラン</th>
                    <th className="px-6 py-4">次回更新・終了予定日</th>
                    <th className="px-6 py-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100 text-slate-700 bg-amber-50/10">
                  {suspiciousList.map((item) => {
                    const isPremium = item.plan === "premium" || item.status === "active";
                    const isRedirecting = redirectingId === item.id;

                    return (
                      <tr key={item.id} className="hover:bg-amber-50/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground">{item.userName || "未設定"}</span>
                            <span className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-0.5">
                              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                              {item.userEmail}
                            </span>
                            {item.stripeCustomerId && (
                              <span className="text-[10px] text-muted-foreground font-mono mt-1 select-all">
                                Cust ID: {item.stripeCustomerId}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200`}>
                            {item.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center text-xs font-medium text-muted-foreground`}>
                            {isPremium ? "プレミアムプラン" : "フリープラン"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground">
                          {item.currentPeriodEnd 
                            ? new Date(item.currentPeriodEnd).toLocaleDateString("ja-JP", {
                                year: "numeric",
                                month: "long",
                                day: "numeric"
                              })
                            : "一括 / 期限設定なし"
                          }
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleOpenPortal(item.stripeCustomerId, item.id)}
                            disabled={redirectingId !== null || !item.stripeCustomerId}
                            className="inline-flex items-center gap-1.5 text-xs text-amber-800 hover:text-amber-950 border border-amber-200 rounded-lg px-2.5 py-1.5 bg-white shadow-sm hover:shadow transition-all disabled:opacity-40"
                          >
                            <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                            <span>{isRedirecting ? "生成中..." : "支払管理"}</span>
                            <ExternalLink className="w-3 h-3 text-amber-400" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Normal list */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">正常契約</h3>
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {normalList.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground space-y-1.5">
              <Info className="w-8 h-8 mx-auto text-foreground stroke-[1.5]" />
              <p className="text-sm font-medium text-muted-foreground">正常な契約データはありません。</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <th className="px-6 py-4">顧客 / ユーザー</th>
                    <th className="px-6 py-4">Stripeステータス</th>
                    <th className="px-6 py-4">現在のプラン</th>
                    <th className="px-6 py-4">次回更新・終了予定日</th>
                    <th className="px-6 py-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {normalList.map((item) => {
                    const isPremium = item.plan === "premium" || item.status === "active";
                    const isRedirecting = redirectingId === item.id;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground">{item.userName || "未設定"}</span>
                            <span className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-0.5">
                              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                              {item.userEmail}
                            </span>
                            {item.stripeCustomerId && (
                              <span className="text-[10px] text-muted-foreground font-mono mt-1 select-all">
                                Cust ID: {item.stripeCustomerId}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            item.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                          }`}>
                            {item.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center text-xs font-medium ${
                            isPremium ? "text-amber-600 font-semibold" : "text-muted-foreground"
                          }`}>
                            {isPremium ? "プレミアムプラン" : "フリープラン"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground">
                          {item.currentPeriodEnd 
                            ? new Date(item.currentPeriodEnd).toLocaleDateString("ja-JP", {
                                year: "numeric",
                                month: "long",
                                day: "numeric"
                              })
                            : "一括 / 期限設定なし"
                          }
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleOpenPortal(item.stripeCustomerId, item.id)}
                            disabled={redirectingId !== null || !item.stripeCustomerId}
                            className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-foreground border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white shadow-sm hover:shadow transition-all disabled:opacity-40"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>{isRedirecting ? "生成中..." : "支払管理"}</span>
                            <ExternalLink className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
