"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { GoogleSignInButton } from "./google-sign-in-button";

export function SignUpForm({ isGoogleEnabled }: { isGoogleEnabled: boolean }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const formData = new FormData(e.currentTarget);
      const displayName = formData.get("displayName") as string;
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const newsletterOptIn = formData.get("newsletterOptIn") === "on";

      if (!email || !password || !displayName) {
        setError("すべての項目を入力してください。");
        setIsLoading(false);
        return;
      }

      if (password.length < 8) {
        setError("パスワードは8文字以上である必要があります。");
        setIsLoading(false);
        return;
      }

      // Call the signup endpoint
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, displayName, newsletterOptIn }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "アカウント作成に失敗しました。");
        setIsLoading(false);
        return;
      }

      // Show success message and redirect to login
      setMessage("アカウントを作成しました。ログインしてください。");
      setTimeout(() => {
        // Keep the address only in this browser tab. It is not placed in a URL,
        // cookie, analytics event, or server log.
        sessionStorage.setItem("yohaku_signup_email", email);
        router.push("/login?message=signup-success&callbackUrl=/onboarding");
        router.refresh();
      }, 1500);
    } catch (err) {
      console.error("[signup] Error:", err);
      setError("アカウント作成に失敗しました。もう一度お試しください。");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            表示名
          </label>
          <input
            type="text"
            name="displayName"
            required
            disabled={isLoading}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:opacity-50"
            placeholder="あなたの名前"
          />
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-600">
          <input type="checkbox" name="newsletterOptIn" className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500" disabled={isLoading} />
          <span><span className="font-medium text-slate-700">YOHAKUの情報を受け取りますか？</span><br /><span className="text-xs text-slate-500">製品の更新、学びのヒント、活動のお知らせをメールでお届けします。いつでも設定から停止できます。</span></span>
        </label>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            メールアドレス
          </label>
          <input
            type="email"
            name="email"
            required
            disabled={isLoading}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:opacity-50"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            パスワード
          </label>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            disabled={isLoading}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:opacity-50"
            placeholder="8文字以上"
          />
        </div>

        {error && (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-600">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 shadow-sm disabled:opacity-50"
        >
          {isLoading ? "作成中..." : "アカウントを作成"}
        </button>
      </form>

      {isGoogleEnabled && (
        <>
          <div className="mb-6">
            <GoogleSignInButton label="Googleで続ける" />
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-muted-foreground">または</span>
            </div>
          </div>
        </>
      )}

      {!isGoogleEnabled && (
        <div className="mb-6 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700 text-center">
          Googleログインはこの環境ではまだ利用できません。メールアドレスとパスワードで続けてください。
        </div>
      )}
    </>
  );
}
