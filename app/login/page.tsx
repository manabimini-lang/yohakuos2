import Link from "next/link";

export const dynamic = "force-dynamic";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; redirect?: string };
}) {
  const errorMessage =
    searchParams.error === "invalid-credentials"
      ? "メールアドレスまたはパスワードが間違っています。"
      : searchParams.error === "missing-fields"
      ? "メールアドレスとパスワードを入力してください。"
      : searchParams.error === "server-error"
      ? "サーバーエラーが発生しました。時間をおいてお試しください。"
      : searchParams.error
      ? "ログインに失敗しました。"
      : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-medium tracking-widest text-slate-800">YOHAKU</h1>
          <p className="mt-3 text-sm text-slate-400">
            学びを、余白のある習慣に。
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-600 text-center">
            {errorMessage}
          </div>
        )}

        <form
          action="/api/auth/login"
          method="POST"
          className="space-y-4 mb-6"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              name="email"
              required
              className="yohaku-input"
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
              className="yohaku-input"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="yohaku-btn w-full"
          >
            ログイン
          </button>
        </form>

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
            href="/signup"
            className="yohaku-btn-ghost w-full"
          >
            アカウントを作成
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          <Link href="/terms" className="underline hover:text-slate-600">利用規約</Link>
          および
          <Link href="/privacy" className="underline hover:text-slate-600">プライバシーポリシー</Link>
          をご確認ください。
        </p>
      </div>
    </div>
  );
}