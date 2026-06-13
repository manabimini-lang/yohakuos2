import Link from "next/link";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: { status?: string; error?: string };
}) {
  const isSent = searchParams.status === "sent";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-medium tracking-widest text-foreground">YOHAKU</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            パスワード再設定
          </p>
        </div>

        {isSent ? (
          <div className="text-center">
            <div className="mb-6 rounded-xl border border-slate-100 bg-slate-50 p-6">
              <p className="text-sm text-slate-600 leading-relaxed">
                ご案内をお送りしました。
                <br />
                静かな時間に、
                <br />
                メールをご確認ください。
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex w-full justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              ログインへ戻る
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm text-slate-600 text-center leading-relaxed">
              登録済みのメールアドレスを入力してください。
              <br />
              再設定用のご案内をお送りします。
            </p>

            {searchParams.error === "missing-email" && (
              <div className="mb-5 rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-600 text-center">
                メールアドレスを入力してください。
              </div>
            )}

            <form
              action="/api/auth/forgot-password"
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
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-foreground transition-opacity hover:opacity-90 shadow-sm"
              >
                送信する
              </button>
            </form>

            <div className="text-center mt-4">
              <Link href="/login" className="text-sm text-muted-foreground hover:text-slate-700 underline underline-offset-2">
                キャンセルして戻る
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
