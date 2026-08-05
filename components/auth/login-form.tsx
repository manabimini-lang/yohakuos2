"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { GoogleSignInButton } from "./google-sign-in-button";

export function LoginForm({ isGoogleEnabled }: { isGoogleEnabled: boolean }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/yui";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      if (!email || !password) {
        setError("メールアドレスとパスワードを入力してください。");
        setIsLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("メールアドレスまたはパスワードが間違っています。");
      } else if (result?.ok) {
        router.push(redirectTo);
        router.refresh();
      }
    } catch (err) {
      console.error("[login] Error:", err);
      setError("ログインに失敗しました。もう一度お試しください。");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            メールアドレス
          </label>
          <input
            type="email"
            name="email"
            required
            disabled={isLoading}
            className="yohaku-input disabled:opacity-50"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-slate-700">
              パスワード
            </label>
            <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-slate-700 underline underline-offset-2">
              パスワードを忘れましたか？
            </Link>
          </div>
          <input
            type="password"
            name="password"
            required
            disabled={isLoading}
            className="yohaku-input disabled:opacity-50"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="yohaku-btn w-full disabled:opacity-50"
        >
          {isLoading ? "ログイン中..." : "ログイン"}
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
