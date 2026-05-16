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
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-14 items-center justify-between gap-4 px-4 lg:px-6">
        <details className="relative lg:hidden">
          <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50">
            <Menu className="h-4 w-4" />
          </summary>
          <div className="absolute left-0 top-12 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
            <MemberSidebarNav />
          </div>
        </details>

        <div className="ml-auto flex items-center gap-3">
          {user.image ? (
            <img
              src={user.image}
              alt={displayName}
              className="h-8 w-8 rounded-full border border-slate-200 object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
              {initial}
            </div>
          )}
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-900">{displayName}</p>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
            >
              ログアウト
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
