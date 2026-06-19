"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateMemoryMetadata } from "@/lib/url-processing";

export async function saveMemoryAction(url: string, context?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Step 3: URL判定 & Metadata生成
  const processed = await generateMemoryMetadata(url);

  // Step 4 & 9: ContentItem 作成（reflection を保持）
  const item = await prisma.contentItem.create({
    data: {
      userId: session.user.id,
      url,
      type: processed.contentType === "pdf" ? "pdf" : "url", // Schemaの制約 'url' | 'pdf' に合わせる
      title: processed.title,
      thumbnailUrl: processed.thumbnailUrl,
      contentType: processed.contentType,
      metadata: processed.metadata as any,
      summary: "", // AI生成までの初期値
      aiTags: [],  // AI生成までの初期値
      reflection: context, 
      meaningStatus: "pending",
    }
  });

  // CaptureJob生成
  // Serverless環境（Vercel）での関数終了による消失を防ぐため、確実に await します
  await prisma.captureJob.create({
    data: {
      contentItemId: item.id,
      url,
    }
  });

  return { ok: true, itemId: item.id };
}
