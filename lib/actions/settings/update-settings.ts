"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { CARD_STYLE_VALUES } from "@/lib/settings/types";

const settingsSchema = z.object({
  siteTitle: z.string().min(1, "site title is required"),
  siteDescription: z.string().min(1, "site description is required"),
  logoUrl: z.union([z.string().url("logo url must be valid"), z.literal("")]),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "primary color must be #RRGGBB"),
  cardStyle: z.enum(CARD_STYLE_VALUES),
});

export type UpdateSettingsInput = z.infer<typeof settingsSchema>;
export type UpdateSettingsResult = {
  ok: boolean;
  error?: string;
};

export async function updateSettingsAction(
  input: UpdateSettingsInput,
): Promise<UpdateSettingsResult> {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "validation failed" };
  }

  const data = parsed.data;

  try {
    await (prisma as any).siteSettings.upsert({
      where: { id: "global" },
      update: {
        siteTitle: data.siteTitle,
        siteDescription: data.siteDescription,
        logoUrl: data.logoUrl || null,
        primaryColor: data.primaryColor,
        cardStyle: data.cardStyle,
      },
      create: {
        id: "global",
        siteTitle: data.siteTitle,
        siteDescription: data.siteDescription,
        logoUrl: data.logoUrl || null,
        primaryColor: data.primaryColor,
        cardStyle: data.cardStyle,
      },
    });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "failed to save settings",
    };
  }

  revalidatePath("/");
  revalidatePath("/member");
  revalidatePath("/member/contents");
  revalidatePath("/admin/settings");

  return { ok: true };
}
