"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

interface GoogleSignInButtonProps {
  label: string;
}

export function GoogleSignInButton({ label }: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    console.log("[GOOGLE_SSO_START]", { callbackUrl: "/inbox" });
    try {
      await signIn("google", { callbackUrl: "/inbox" });
    } catch (err) {
      console.error("[GOOGLE_SSO_ERROR] Google sign in failed:", err);
      window.location.href = `/login?error=google-error`;
    }
  };

  return (
    <button
      onClick={handleSignIn}
      disabled={loading}
      className="yohaku-btn-ghost w-full flex items-center justify-center gap-3 py-3"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      ) : (
        <svg className="w-4 h-4 text-muted-foreground fill-current" viewBox="0 0 24 24">
          <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.137 4.114-3.707 0-6.712-3.006-6.712-6.712s3.005-6.71 6.712-6.71c1.714 0 3.265.646 4.457 1.714l3.2-3.2C19.585 1.583 16.137 0 12.24 0 5.58 0 0 5.58 0 12.24s5.58 12.24 12.24 12.24c6.76 0 12.24-5.48 12.24-12.24 0-.834-.085-1.637-.24-2.41H12.24z" />
        </svg>
      )}
      <span className="text-slate-700 font-light">{label}</span>
    </button>
  );
}
