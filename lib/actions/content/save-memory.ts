"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateMemoryMetadata } from "@/lib/url-processing";

export async function saveMemoryAction(url: string, context?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Step 3: URL判定 & Metadata生成
  const processed = await generateMemoryMetadata(url);

  // Step 4 & 9: ContentItem 作成（savedContext を保持）
  const item = await prisma.contentItem.create({
    data: {
      userId: session.user.id,
      url,
      title: processed.title,
      thumbnailUrl: processed.thumbnailUrl,
      contentType: processed.contentType,
      metadata: {
        ...(processed.metadata as any),
        description: processed.description,
      },
      savedContext: context, 
      snapshotStatus: "pending",
      meaningStatus: "pending",
    }
  });

  // SnapshotJob生成 (レスポンスは待たない)
  void prisma.snapshotJob.create({
    data: {
      contentItemId: item.id,
      url,
    }
  });

  return { ok: true, itemId: item.id };
}