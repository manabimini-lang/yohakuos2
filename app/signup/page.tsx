import { redirect } from "next/navigation";
import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { auth } from "@/lib/auth";
import { SignUpForm } from "@/components/auth/signup-form";

export const dynamic = "force-dynamic";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string };
}) {
  // Redirect if already logged in
  const session = await auth();
  if (session?.user) {
    redirect("/yui");
  }

  const errorMessage =
    (searchParams.error === "OAuthSignin" || searchParams.error === "OAuthCallback" || searchParams.error === "google-error")
      ? "Googleとの接続を完了できませんでした。少し時間を空けて、もう一度お試しください。"
      : searchParams.error
      ? "アカウント作成に失敗しました。もう一度お試しください。"
      : null;

  const isGoogleEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  const successMessage = searchParams.message === "signup-success"
    ? "アカウントを作成しました。ログインしてください。"
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-medium tracking-widest text-foreground">YOHAKU</h1>
          <p className="mt-3 text-sm text-muted-foreground">
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

        <SignUpForm isGoogleEnabled={isGoogleEnabled} />

        <div className="space-y-3">
          <Link
            href="/login"
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            すでにアカウントをお持ちの方
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
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