import { redirect } from "next/navigation";
import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export const dynamic = "force-dynamic";

export default function SignUpPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string };
}) {
  const errorMessage =
    (searchParams.error === "OAuthSignin" || searchParams.error === "OAuthCallback" || searchParams.error === "google-error")
      ? "Googleとの接続を完了できませんでした。少し時間を空けて、もう一度お試しください。"
      : searchParams.error
      ? "アカウント作成に失敗しました。もう一度お試しください。"
      : null;

  const isGoogleEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  const successMessage = searchParams.message === "check-email"
    ? "確認メールを送信しました。メールをご確認ください。"
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-medium tracking-widest text-slate-800">YOHAKU</h1>
          <p className="mt-3 text-sm text-slate-400">
            アカウントを作成する
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-600 text-center">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-600 text-center">
            {successMessage}
          </div>
        )}

        <form
          action="/api/auth/signup"
          method="POST"
          className="space-y-4 mb-6"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              表示名
            </label>
            <input
              type="text"
              name="displayName"
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              placeholder="あなたの名前"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
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
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              placeholder="8文字以上"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 shadow-sm"
          >
            アカウントを作成
          </button>
        </form>

        {isGoogleEnabled && (
          <div className="mb-6">
            <GoogleSignInButton label="Googleで続ける" />
          </div>
        )}

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-slate-500">または</span>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href="/login"
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            すでにアカウントをお持ちの方
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          登録することで、
          <Link href="/terms" className="underline hover:text-slate-600">利用規約</Link>
          および
          <Link href="/privacy" className="underline hover:text-slate-600">プライバシーポリシー</Link>
          に同意したものとみなされます。
        </p>
      </div>
    </div>
  );
}