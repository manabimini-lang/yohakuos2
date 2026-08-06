"use client";

import { FormEvent, useState, useCallback } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Turnstile } from "@marsidev/react-turnstile";
import { GoogleSignInButton } from "./google-sign-in-button";

// ---------------------------------------------------------------------------
// Inline helpers (client-side, no server imports)
// ---------------------------------------------------------------------------

function generateAuthRequestId(): string {
  const now = new Date();
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const hex = Math.random().toString(16).slice(2, 8).toUpperCase();
  return `AUTH-${date}-${hex}`;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  return `${local.slice(0, 2)}***@${domain}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface LoginFormProps {
  isGoogleEnabled: boolean;
  turnstileSiteKey?: string;
}

export function LoginForm({ isGoogleEnabled, turnstileSiteKey }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirectTo = searchParams.get("callbackUrl") || searchParams.get("redirect") || "/yui";
  const redirectTo = rawRedirectTo.startsWith("/") && !rawRedirectTo.startsWith("//") ? rawRedirectTo : "/yui";

  const isTurnstileRequired = !!turnstileSiteKey;

  const handleTurnstileSuccess = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  const handleTurnstileError = useCallback(() => {
    setTurnstileToken(null);
  }, []);

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileToken(null);
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const requestId = generateAuthRequestId();
    const start = Date.now();

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      if (!email || !password) {
        setError("メールアドレスとパスワードを入力してください。");
        setIsLoading(false);
        return;
      }

      if (isTurnstileRequired && !turnstileToken) {
        setError("セキュリティ認証を完了してください。");
        setIsLoading(false);
        return;
      }

      console.info(
        `[auth] stage=login_form requestId=${requestId} email=${maskEmail(email)} hasTurnstile=${!!turnstileToken} turnstileConfigured=${!!turnstileSiteKey}`
      );

      const result = await signIn("credentials", {
        email,
        password,
        turnstileToken: turnstileToken ?? "",
        authRequestId: requestId,
        redirect: false,
      });

      const elapsed = Date.now() - start;

      console.info(
        `[auth] stage=login_form_result requestId=${requestId} ok=${result?.ok} error=${result?.error ?? "none"} status=${result?.status} elapsed=${elapsed}ms`
      );

      if (result?.error) {
        setError("メールアドレスまたはパスワードが間違っています。");
      } else if (result?.ok) {
        console.info(
          `[auth] stage=login_redirect requestId=${requestId} redirectTo=${redirectTo}`
        );
        router.push(redirectTo);
        router.refresh();
      } else {
        console.warn(
          `[auth] stage=login_form_result requestId=${requestId} result=unexpected`
        );
        setError("ログインに失敗しました。もう一度お試しください。");
      }
    } catch (err) {
      const elapsed = Date.now() - start;
      console.error(
        `[auth] stage=login_form_error requestId=${requestId} error=${err instanceof Error ? err.message : String(err)} elapsed=${elapsed}ms`
      );
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

        {turnstileSiteKey && (
          <div className="flex justify-center">
            <Turnstile
              siteKey={turnstileSiteKey}
              onSuccess={handleTurnstileSuccess}
              onError={handleTurnstileError}
              onExpire={handleTurnstileExpire}
            />
          </div>
        )}

        {error && (
          <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || (isTurnstileRequired && !turnstileToken)}
          className="yohaku-btn w-full disabled:opacity-50"
        >
          {isLoading ? "ログイン中..." : "ログイン"}
        </button>
      </form>

      {isGoogleEnabled && (
        <>
          <div className="mb-6">
            <GoogleSignInButton label="Googleで続ける" callbackUrl={redirectTo} />
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
