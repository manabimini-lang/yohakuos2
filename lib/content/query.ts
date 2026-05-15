import {
  ContentLayer,
  ContentType,
  ContentVisibility,
  PublishStatus,
} from "@prisma/client";

import { buildFilterQuery } from "@/lib/content/filter-query";
import { prisma } from "@/lib/prisma";
import type { ParsedContentSearchParams } from "@/lib/utils/search-params";

export const CONTENT_PAGE_SIZE = 10;

export type ContentFilterInput = {
  params: ParsedContentSearchParams;
};

export type ContentListItem = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  contentType: ContentType;
  visibility: ContentVisibility;
  publishStatus: PublishStatus;
  layer: ContentLayer;
  releaseDate: Date | null;
  updatedAt: Date;
};

export async function getContentsList(input: ContentFilterInput) {
  const page = Math.max(1, input.params.page ?? 1);
  const limit = Math.max(1, Math.min(input.params.limit ?? CONTENT_PAGE_SIZE, 50));
  const where = buildFilterQuery({ ...input.params, mode: "admin" });

  const [items, total] = await Promise.all([
    prisma.content.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
        contentType: true,
        visibility: true,
        publishStatus: true,
        layer: true,
        releaseDate: true,
        updatedAt: true,
      },
    }),
    prisma.content.count({ where }),
  ]);

  return {
    items: items as ContentListItem[],
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
