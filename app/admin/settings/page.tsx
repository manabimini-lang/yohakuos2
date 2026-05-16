import { SettingsForm } from "@/components/admin/settings-form";
import { getSiteSettings } from "@/lib/settings/get-settings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <section className="space-y-4">
      <header className="rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="text-lg font-semibold text-slate-900">サイト設定</h1>
        <p className="mt-1 text-sm text-slate-600">
          ブランドカラー・ロゴ・カード表示スタイルを管理します。
        </p>
      </header>
      <SettingsForm
        defaultValues={{
          siteTitle: settings.siteTitle,
          siteDescription: settings.siteDescription,
          logoUrl: settings.logoUrl ?? "",
          primaryColor: settings.primaryColor,
          cardStyle: settings.cardStyle,
        }}
      />
    </section>
  );
}
