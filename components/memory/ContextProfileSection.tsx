"use client";

import type { ContextProfileViewModel } from "@/lib/memory/view-models/context-profile";

export function ContextProfileSection({ profile }: { profile: ContextProfileViewModel | null }) {
  if (!profile) {
    return (
      <section className="mb-10 rounded-2xl border border-dashed border-border bg-white/[0.01] p-6 text-center">
        <p className="text-sm font-light text-muted-foreground">
          余白が増えると、最近のテーマが見えてきます。
        </p>
      </section>
    );
  }

  return (
    <section className="mb-10 space-y-4 rounded-2xl border border-border bg-card p-6">
      <div className="space-y-1 text-center">
        <div className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
          {profile.title}
        </div>
        <p className="text-[11px] text-muted-foreground font-light">{profile.description}</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {profile.themes.map((theme, index) => (
          <div key={theme} className="flex items-center">
            <span className="text-sm font-light text-muted-foreground px-2 py-1">
              {theme}
            </span>
            {index < profile.themes.length - 1 && (
              <span className="text-slate-700 text-xs mx-1 font-light">×</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
