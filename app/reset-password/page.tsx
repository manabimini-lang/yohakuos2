"use client";

import { useState } from "react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!password || !confirmPassword) {
      setError("パスワードを入力してください。");
      setIsSubmitting(false);
      return;
    }

    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください。");
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("パスワードが一致しません。");
      setIsSubmitting(false);
      return;
    }

    try {
      // In a client component, we should call an API route or server action
      // For this implementation, we will use a server action.
      // Assuming updatePassword is made a server action or we need to wrap it.
      // Wait, updatePassword in core/auth/server/index.ts is just a server-side function.
      // If we call it directly here, we need it to be a Server Action.
      // Let's create an inline Server Action or a dedicated one.
      
      // Let's call the server action from another file or use fetch if it was an API.
      // To simplify, let's just make a fetch call to a new API route, OR since we don't have that API route,
      // let's use the Supabase client directly since this is client-side.
      
      const { getSupabaseClient } = await import("@/infra/supabase/client");
      const supabase = getSupabaseClient();
      
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      setIsSuccess(true);
    } catch (err: any) {
      console.error("[reset-password] Error:", err);
      setError("再設定を完了できませんでした。少し時間を空けて、もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-medium tracking-widest text-foreground">YOHAKU</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            新しいパスワードの設定
          </p>
        </div>

        {isSuccess ? (
          <div className="text-center">
            <div className="mb-6 rounded-xl border border-emerald-100 bg-emerald-50 p-6">
              <p className="text-sm text-emerald-700 leading-relaxed font-medium">
                パスワードを更新しました。
                <br />
                再びYOHAKUへ戻れます。
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex w-full justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-foreground transition-opacity hover:opacity-90 shadow-sm"
            >
              ログインへ戻る
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-5 rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-600 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  新しいパスワード
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={8}
                  disabled={isSubmitting}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:opacity-50"
                  placeholder="8文字以上"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  新しいパスワード（確認用）
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  minLength={8}
                  disabled={isSubmitting}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:opacity-50"
                  placeholder="もう一度入力"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-foreground transition-opacity hover:opacity-90 shadow-sm disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isSubmitting ? "更新中..." : "パスワードを更新"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
