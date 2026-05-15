import { ContentVisibility, PublishStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function getFeaturedPublicContents() {
  return prisma.content.findMany({
    where: {
      publishStatus: PublishStatus.PUBLISHED,
      visibility: {
        in: [ContentVisibility.PUBLIC, ContentVisibility.FREE],
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 6,
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      thumbnailUrl: true,
      contentType: true,
      layer: true,
      updatedAt: true,
    },
  });
}
