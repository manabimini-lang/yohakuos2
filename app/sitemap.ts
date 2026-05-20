import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://yohakuos2.vercel.app";
  const routes = [
    "",
    "/login",
    "/pricing",
    "/guidelines",
    "/ai-policy",
    "/legal",
    "/terms",
    "/privacy",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split("T")[0],
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1.0 : 0.5,
  }));
}
