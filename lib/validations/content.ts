import { ContentLayer, ContentType, ContentVisibility, PublishStatus } from "@prisma/client";
import { z } from "zod";

export const createContentSchema = z.object({
  title: z.string().min(1, "title is required"),
  slug: z.string().min(1, "slug is required"),
  description: z.string().optional(),
  thumbnailUrl: z.union([
    z.string().url("thumbnail_url must be a valid URL"),
    z.literal(""),
  ]),
  content: z.string().optional(),
  contentType: z.nativeEnum(ContentType, { message: "content_type is required" }),
  visibility: z.nativeEnum(ContentVisibility),
  publishStatus: z.nativeEnum(PublishStatus),
  layer: z.nativeEnum(ContentLayer),
  releaseDate: z.union([z.string(), z.literal("")]),
  tagIds: z.array(z.string()),
});

export type CreateContentInput = z.infer<typeof createContentSchema>;
