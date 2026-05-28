"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function retryAudioReflectionGeneration(reflectionId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Verify ownership
    const reflection = await prisma.audioReflection.findUnique({
      where: { id: reflectionId },
    });

    if (!reflection || reflection.userId !== session.user.id) {
      throw new Error("Reflection not found");
    }

    // Reset status to pending
    await prisma.audioReflection.update({
      where: { id: reflectionId },
      data: { status: "pending" },
    });

    // Create new AIJob for retry
    await prisma.aIJob.create({
      data: {
        userId: session.user.id,
        jobType: "generate_audio_reflection",
        status: "pending",
        input: {
          reflectionId,
          script: reflection.script,
        },
      },
    });

    revalidatePath("/reflections");
    revalidatePath(`/reflections/${reflectionId}`);

    return { success: true };
  } catch (error) {
    console.error("[retry-audio-reflection] Error:", error);
    return { success: false, error: "Failed to retry reflection generation" };
  }
}
