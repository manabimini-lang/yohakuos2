import {
  ContentLayer,
  ContentType,
  ContentVisibility,
  UserRole,
} from "@prisma/client";

import { buildFilterQuery } from "@/lib/content/filter-query";
import { prisma } from "@/lib/prisma";
import type { ParsedContentSearchParams } from "@/lib/utils/search-params";

export const MEMBER_CONTENTS_PAGE_SIZE = 12;

export type MemberContentsQueryInput = {
  params: ParsedContentSearchParams;
  role: UserRole;
};

export type MemberContentItem = {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  contentType: ContentType;
  layer: ContentLayer;
  visibility: ContentVisibility;
  updatedAt: Date;
  tags: { id: string; name: string; slug: string }[];
  locked: boolean;
  isNew: boolean;
  isRecommended: boolean;
};

export async function getMemberContents(input: MemberContentsQueryInput) {
  const page = Math.max(1, input.params.page ?? 1);
  const limit = Math.max(1, Math.min(input.params.limit ?? MEMBER_CONTENTS_PAGE_SIZE, 30));
  const where = buildFilterQuery({ ...input.params, mode: "member" });

  const [items, total, availableTags] = await Promise.all([
    prisma.content.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        thumbnailUrl: true,
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
    }),
    prisma.content.count({ where }),
    prisma.tag.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  const now = Date.now();
  const sevenDays = 1000 * 60 * 60 * 24 * 7;

  const mapped: MemberContentItem[] = items.map((item, index) => {
    const locked =
      input.role === UserRole.FREE_MEMBER && item.visibility === ContentVisibility.PAID;
    const isNew = now - item.updatedAt.getTime() <= sevenDays;
    const isRecommended = index < 3;

    return {
      id: item.id,
      title: item.title,
      description: item.description,
      thumbnailUrl: item.thumbnailUrl,
      contentType: item.contentType,
      layer: item.layer,
      visibility: item.visibility,
      updatedAt: item.updatedAt,
      tags: item.tags.map((t) => t.tag),
      locked,
      isNew,
      isRecommended,
    };
  });

  return {
    items: mapped,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    tags: availableTags,
  };
}
