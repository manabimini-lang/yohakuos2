import {
  ContentLayer,
  ContentType,
  ContentVisibility,
  PublishStatus,
  UserRole,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

const MEMBER_VISIBLE: ContentVisibility[] = [
  ContentVisibility.PUBLIC,
  ContentVisibility.FREE,
  ContentVisibility.PAID,
];

export async function getContentDetailBySlug(slug: string) {
  return prisma.content.findFirst({
    where: {
      slug,
      publishStatus: PublishStatus.PUBLISHED,
      visibility: { in: MEMBER_VISIBLE },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      thumbnailUrl: true,
      content: true,
      contentType: true,
      layer: true,
      visibility: true,
      updatedAt: true,
      tags: {
        select: {
          tag: {
            select: { id: true, name: true, slug: true },
          },
        },
      },
    },
  });
}

export function isLockedForRole(role: UserRole, visibility: ContentVisibility) {
  return role === UserRole.FREE_MEMBER && visibility === ContentVisibility.PAID;
}

export async function getRelatedContents(contentId: string, tagIds: string[]) {
  if (tagIds.length === 0) return [];

  return prisma.content.findMany({
    where: {
      id: { not: contentId },
      publishStatus: PublishStatus.PUBLISHED,
      visibility: { in: MEMBER_VISIBLE },
      tags: {
        some: { tagId: { in: tagIds } },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 3,
    select: {
      id: true,
      slug: true,
      title: true,
      contentType: true,
      layer: true,
      updatedAt: true,
    },
  });
}

export async function getNextSuggestion(
  contentId: string,
  layer: ContentLayer,
  contentType: ContentType,
) {
  const strict = await prisma.content.findFirst({
    where: {
      id: { not: contentId },
      publishStatus: PublishStatus.PUBLISHED,
      visibility: { in: MEMBER_VISIBLE },
      layer,
      contentType,
    },
    orderBy: { updatedAt: "desc" },
    select: {
      slug: true,
      title: true,
      layer: true,
      contentType: true,
    },
  });
  if (strict) return strict;

  const fallback = await prisma.content.findFirst({
    where: {
      id: { not: contentId },
      publishStatus: PublishStatus.PUBLISHED,
      visibility: { in: MEMBER_VISIBLE },
      OR: [{ layer }, { contentType }],
    },
    orderBy: { updatedAt: "desc" },
    select: {
      slug: true,
      title: true,
      layer: true,
      contentType: true,
    },
  });

  return fallback;
}
