"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, MessageSquare, CheckCircle2, AlertCircle } from "lucide-react";

type AccountClientProps = {
  discordId: string | null;
  discordName: string | null;
  discordAvatar: string | null;
};

export function AccountClient({
  discordId,
  discordName,
  discordAvatar,
}: AccountClientProps) {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(Boolean(discordId));

  const handleConnect = () => {
    setConnecting(true);
    window.location.href = "/api/auth/discord/connect";
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Discord連携を解除しますか？")) return;
    setDisconnecting(true);
    try {
      const response = await fetch("/api/auth/discord/disconnect", { method: "POST" });
      if (!response.ok) throw new Error("disconnect failed");
      setIsConnected(false);
    } catch {
      window.alert("連携を解除できませんでした。もう一度お試しください。");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-6 py-12 md:py-24 space-y-10 selection:bg-slate-100">
      {/* Back to Profile */}
      <div>
        <Link 
          href="/settings" 
          className="inline-flex items-center text-xs text-muted-foreground hover:text-slate-650 transition-colors font-mono"
        >
          <ChevronLeft className="w-3.5 h-3.5 mr-1" />
          Settings
        </Link>
      </div>

      {/* Page Title */}
      <div className="space-y-2">
        <h1 className="text-2xl font-serif text-foreground tracking-wide">
          外部サービス連携
        </h1>
        <p className="text-xs text-muted-foreground leading-relaxed">
          YOHAKUとDiscordをつなぐ設定です。連携しなくても、記録・AI機能は利用できます。
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          設定した連携は、Inbox にも案内として表示されます。
        </p>
      </div>

      {/* Success Notification */}
      {success && (
        <div className="flex items-start space-x-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 p-4 animate-in fade-in duration-500">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-emerald-700">
            <p className="font-semibold">連携が完了しました</p>
            <p className="text-[11px] text-emerald-600/90 leading-relaxed">Discordアカウントと連携しました。共有するときだけ、指定チャンネルへ投稿します。</p>
          </div>
        </div>
      )}

      {/* Discord Connection Card */}
      <div className="bg-white border border-slate-150 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-50">
          <div className="p-2 bg-slate-50 rounded-xl text-muted-foreground">
            <MessageSquare className="w-5 h-5 stroke-[1.5]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Discord 連携</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">記録の一部を、指定チャンネルへ共有するための接続</p>
          </div>
        </div>

        {isConnected ? (
          /* Connected State */
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100/80">
            <div className="flex items-center space-x-3">
              {discordAvatar ? (
                <img 
                  src={discordAvatar} 
                  alt={discordName || "Discord Avatar"} 
                  className="w-10 h-10 rounded-full border border-slate-200 object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-muted-foreground">
                  {(discordName || "D").charAt(0).toUpperCase()}
                </div>
              )}
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">{discordName}</p>
                <div className="inline-flex items-center text-[10px] font-semibold text-emerald-600 space-x-1">
                  <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                  <span>接続済み</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={handleConnect} className="text-xs text-muted-foreground hover:text-slate-650 transition-colors font-mono py-1.5 px-3 rounded-lg hover:bg-slate-100">再連携</button>
              <button onClick={() => void handleDisconnect()} disabled={disconnecting} className="text-xs text-rose-600 hover:text-rose-700 transition-colors py-1.5 px-3 rounded-lg hover:bg-rose-50 disabled:opacity-50">
                {disconnecting ? "解除中..." : "連携を解除"}
              </button>
            </div>
          </div>
        ) : (
          /* Disconnected State */
          <div className="space-y-5">
            <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
              <p>連携すると、YOHAKUで選んだ気づきだけをDiscordの指定チャンネルへ匿名共有できます。</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>自動投稿はしません。共有ボタンを押したときだけ投稿します。</li>
                <li>共有前に内容を確認できます。連携はいつでも解除できます。</li>
              </ul>
            </div>
            <div className="pt-2">
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="inline-flex items-center justify-center space-x-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium px-6 py-2.5 transition-colors text-sm shadow-sm disabled:opacity-50"
              >
                {connecting ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                    <span>接続中...</span>
                  </>
                ) : (
                  <span>Discordを連携</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Security Note */}
      <div className="flex items-start space-x-2.5 max-w-sm mx-auto text-[10px] text-slate-450 leading-relaxed">
        <AlertCircle className="w-3.5 h-3.5 text-slate-350 shrink-0 mt-0.5" />
        <p>
          YOHAKUはOAuth接続時に最小限の権限（ユーザー情報の識別のみ）を要求し、アクセストークンをサーバーに保存しません。プライバシーは完全に守られます。
        </p>
      </div>
    </div>
  );
}
