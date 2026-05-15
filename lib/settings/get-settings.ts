import { prisma } from "@/lib/prisma";
import { type CardStyleValue } from "@/lib/settings/types";

export type SiteSettingsShape = {
  siteTitle: string;
  siteDescription: string;
  logoUrl: string | null;
  primaryColor: string;
  cardStyle: CardStyleValue;
};

export const DEFAULT_SITE_SETTINGS: SiteSettingsShape = {
  siteTitle: "YOHAKU",
  siteDescription: "学びを、余白のある習慣に。",
  logoUrl: null,
  primaryColor: "#0f172a",
  cardStyle: "DEFAULT",
};

export async function getSiteSettings(): Promise<SiteSettingsShape> {
  const settings = await (prisma as any).siteSettings.findUnique({
    where: { id: "global" },
    select: {
      siteTitle: true,
      siteDescription: true,
      logoUrl: true,
      primaryColor: true,
      cardStyle: true,
    },
  });

  if (!settings) {
    return DEFAULT_SITE_SETTINGS;
  }

  return {
    siteTitle: settings.siteTitle || DEFAULT_SITE_SETTINGS.siteTitle,
    siteDescription: settings.siteDescription || DEFAULT_SITE_SETTINGS.siteDescription,
    logoUrl: settings.logoUrl,
    primaryColor: settings.primaryColor || DEFAULT_SITE_SETTINGS.primaryColor,
    cardStyle: (settings.cardStyle as CardStyleValue) || DEFAULT_SITE_SETTINGS.cardStyle,
  };
}
