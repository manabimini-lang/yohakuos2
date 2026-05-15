"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createContentSchema, type CreateContentInput } from "@/lib/validations/content";

export type UpdateContentActionResult = {
  error?: string;
  fieldErrors?: Partial<Record<keyof CreateContentInput, string>>;
};

export async function updateContentAction(
  contentId: string,
  payload: CreateContentInput,
): Promise<UpdateContentActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in." };
  }

  const existing = await prisma.content.findUnique({
    where: { id: contentId },
    select: { id: true },
  });

  if (!existing) {
    return { error: "Content not found." };
  }

  const parsed = createContentSchema.safeParse(payload);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      fieldErrors: {
        title: fieldErrors.title?.[0],
        slug: fieldErrors.slug?.[0],
        contentType: fieldErrors.contentType?.[0],
      },
    };
  }

  const data = parsed.data;

  try {
    await prisma.content.update({
      where: { id: contentId },
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description || null,
        thumbnailUrl: data.thumbnailUrl || null,
        content: data.content || null,
        contentType: data.contentType,
        visibility: data.visibility,
        publishStatus: data.publishStatus,
        layer: data.layer,
        releaseDate: data.releaseDate ? new Date(data.releaseDate) : null,
        tags: {
          deleteMany: {},
          create: data.tagIds.map((tagId) => ({
            tag: { connect: { id: tagId } },
          })),
        },
      },
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to update content. Please try again.",
    };
  }

  revalidatePath("/admin/contents");
  revalidatePath(`/admin/contents/${contentId}/edit`);
  redirect("/admin/contents");
}
