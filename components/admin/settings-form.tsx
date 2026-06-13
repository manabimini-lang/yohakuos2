"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  updateSettingsAction,
  type UpdateSettingsInput,
} from "@/lib/actions/settings/update-settings";
import { CARD_STYLE_VALUES } from "@/lib/settings/types";

const formSchema = z.object({
  siteTitle: z.string().min(1, "サイトタイトルは必須です"),
  siteDescription: z.string().min(1, "サイトの説明は必須です"),
  logoUrl: z.union([z.string().url("有効なURLを入力してください"), z.literal("")]),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "カラーコードは#RRGGBB形式で入力してください"),
  cardStyle: z.enum(CARD_STYLE_VALUES),
});

export function SettingsForm({ defaultValues }: { defaultValues: UpdateSettingsInput }) {
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateSettingsInput>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    setServerMessage(null);
    const result = await updateSettingsAction(values);
    setServerMessage(result.ok ? "設定を保存しました。" : result.error ?? "保存に失敗しました。");
    setIsSubmitting(false);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">サイトタイトル</span>
        <input {...register("siteTitle")} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        {errors.siteTitle?.message ? <p className="mt-1 text-xs text-rose-600">{errors.siteTitle.message}</p> : null}
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">サイトの説明</span>
        <textarea {...register("siteDescription")} rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        {errors.siteDescription?.message ? <p className="mt-1 text-xs text-rose-600">{errors.siteDescription.message}</p> : null}
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">ロゴURL</span>
          <input {...register("logoUrl")} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          {errors.logoUrl?.message ? <p className="mt-1 text-xs text-rose-600">{errors.logoUrl.message}</p> : null}
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">テーマカラー (HEX)</span>
          <input {...register("primaryColor")} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          {errors.primaryColor?.message ? <p className="mt-1 text-xs text-rose-600">{errors.primaryColor.message}</p> : null}
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">カードスタイル</span>
        <select {...register("cardStyle")} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
          {CARD_STYLE_VALUES.map((style) => (
            <option key={style} value={style}>
              {style === "COMPACT" ? "コンパクト" : style === "DEFAULT" ? "デフォルト" : "余裕あり"}
            </option>
          ))}
        </select>
      </label>

      {serverMessage ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          {serverMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-foreground disabled:opacity-60"
      >
        {isSubmitting ? "保存中..." : "設定を保存する"}
      </button>
    </form>
  );
}
