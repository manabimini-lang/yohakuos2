import { useEffect } from "react";

export default function AuthCallback() {
  useEffect(() => {
    // Notify the main window that auth was successful
    if (window.opener) {
      window.opener.postMessage({ type: 'SUPABASE_AUTH_SUCCESS' }, '*');
      window.close();
    } else {
      // Fallback if not in a popup
      window.location.href = '/';
    }
  }, []);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-white p-6 text-center">
      <div className="space-y-4">
        <div className="h-10 w-10 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
        <h1 className="text-xl font-bold">認証を完了しています...</h1>
        <p className="text-muted-foreground text-sm">このウィンドウは自動的に閉じます。</p>
      </div>
    </div>
  );
}
