import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; redirect?: string; callbackUrl?: string };
}) {
  // Redirect if already logged in
  const session = await auth();
  if (session?.user) {
    const rawTarget = searchParams.callbackUrl || searchParams.redirect || "/yui";
    const target = rawTarget.startsWith("/") && !rawTarget.startsWith("//") ? rawTarget : "/yui";
    redirect(target);
  }

  const errorMessage =
    searchParams.error === "CredentialsSignin"
      ? "メールアドレスまたはパスワードが間違っています。"
      : searchParams.error === "missing-fields"
      ? "メールアドレスとパスワードを入力してください。"
      : searchParams.error === "server-error"
      ? "サーバーエラーが発生しました。時間をおいてお試しください。"
      : (searchParams.error === "OAuthSignin" || searchParams.error === "OAuthCallback" || searchParams.error === "OAuthCreateAccount" || searchParams.error === "OAuthAccountNotLinked" || searchParams.error === "google-error")
      ? "Googleとの接続を完了できませんでした。少し時間を空けて、もう一度お試しください。"
      : searchParams.error
      ? "ログインに失敗しました。"
      : null;

  const isGoogleEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-medium tracking-widest text-foreground">YOHAKU</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            学びを、余白のある習慣に。
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-600 text-center">
            {errorMessage}
          </div>
        )}

        <LoginForm isGoogleEnabled={isGoogleEnabled} turnstileSiteKey={turnstileSiteKey} />

        <div className="space-y-3">
          <Link
            href="/signup"
            className="yohaku-btn-ghost w-full"
          >
            アカウントを作成
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link href="/terms" className="underline hover:text-slate-600">利用規約</Link>
          および
          <Link href="/privacy" className="underline hover:text-slate-600">プライバシーポリシー</Link>
          をご確認ください。
        </p>
      </div>
    </div>
  );
}