import { Menu } from "lucide-react";
import { signOut } from "@/lib/auth";
import { MemberSidebarNav } from "@/components/member/sidebar";

type MemberHeaderProps = {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
};

export function MemberHeader({ user }: MemberHeaderProps) {
  const displayName = user.name || user.email || "ユーザー";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
      <div className="flex h-12 items-center justify-between gap-4 px-4 lg:px-8">
        {/* モバイルのみ：ハンバーガー */}
        <details className="relative lg:hidden">
          <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 transition-colors">
            <Menu className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">メニューを開く</span>
          </summary>
          <div className="absolute left-0 top-11 w-64 rounded-2xl border border-slate-100 bg-white p-3 shadow-lg">
            <MemberSidebarNav />
          </div>
        </details>

        {/* モバイルのみ：ロゴ */}
        <span className="text-sm font-medium tracking-widest text-slate-600 lg:hidden">
          YOHAKU
        </span>

        {/* ユーザーエリア */}
        <div className="ml-auto flex items-center gap-3">
          {user.image ? (
            <img
              src={user.image}
              alt={displayName}
              className="h-7 w-7 rounded-full border border-slate-200 object-cover"
            />
          ) : (
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-600"
              aria-hidden="true"
            >
              {initial}
            </div>
          )}

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="rounded-lg px-3 py-1.5 text-xs text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
            >
              ログアウト
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
