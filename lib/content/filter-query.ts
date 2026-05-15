import {
  ContentLayer,
  ContentType,
  ContentVisibility,
  Prisma,
  PublishStatus,
} from "@prisma/client";

import type { ParsedContentSearchParams } from "@/lib/utils/search-params";

const isLayer = (value?: string): value is ContentLayer =>
  !!value && Object.values(ContentLayer).includes(value as ContentLayer);
const isType = (value?: string): value is ContentType =>
  !!value && Object.values(ContentType).includes(value as ContentType);
const isVisibility = (value?: string): value is ContentVisibility =>
  !!value && Object.values(ContentVisibility).includes(value as ContentVisibility);
const isPublishStatus = (value?: string): value is PublishStatus =>
  !!value && Object.values(PublishStatus).includes(value as PublishStatus);

export function buildFilterQuery(
  params: ParsedContentSearchParams & {
    mode: "member" | "admin" | "tag";
    tagSlug?: string;
  },
): Prisma.ContentWhereInput {
  const where: Prisma.ContentWhereInput = {};

  if (params.mode === "member" || params.mode === "tag") {
    where.publishStatus = PublishStatus.PUBLISHED;
    where.visibility = {
      in: [ContentVisibility.PUBLIC, ContentVisibility.FREE, ContentVisibility.PAID],
    };
  }

  if (params.mode === "admin" && isPublishStatus(params.publishStatus)) {
    where.publishStatus = params.publishStatus;
  }
  if (params.mode === "admin" && isVisibility(params.visibility)) {
    where.visibility = params.visibility;
  }

  if (isLayer(params.layer)) {
    where.layer = params.layer;
  }
  if (isType(params.type)) {
    where.contentType = params.type;
  }

  const tagSlug = params.tagSlug ?? params.tag;
  if (tagSlug?.trim()) {
    where.tags = { some: { tag: { slug: tagSlug.trim() } } };
  }

  if (params.q?.trim()) {
    const q = params.q.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { tags: { some: { tag: { name: { contains: q, mode: "insensitive" } } } } },
    ];
  }

  return where;
}
