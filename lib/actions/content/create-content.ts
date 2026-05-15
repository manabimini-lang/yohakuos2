"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createContentSchema, type CreateContentInput } from "@/lib/validations/content";

export type CreateContentActionResult = {
  error?: string;
  fieldErrors?: Partial<Record<keyof CreateContentInput, string>>;
};

export async function createContentAction(
  payload: CreateContentInput,
): Promise<CreateContentActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in." };
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
    await prisma.content.create({
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
        createdBy: session.user.id,
        tags: data.tagIds.length
          ? {
              create: data.tagIds.map((tagId) => ({
                tag: { connect: { id: tagId } },
              })),
            }
          : undefined,
      },
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create content. Please try again.",
    };
  }

  revalidatePath("/admin/contents");
  redirect("/admin/contents");
}
