"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { processAIAnalysis } from "./ai-processing";

// ===================================================
// Helper: Queue AI Job + kick fire-and-forget analysis
// ===================================================
// 将来のWorker化を見据えた構造。
// processAIAnalysis() はQueue-readyなインターフェースで実装済み。
// ===================================================
async function queueAndRunAI(contentItemId: string, userId: string) {
  console.log("AI JOB ENQUEUED", {
    contentId: contentItemId,
    userId,
  });

  // Create AIJob record for tracking/future worker pickup
  await prisma.aIJob.create({
    data: {
      userId,
      jobType: "content_analysis",
      status: "pending",
      input: { contentItemId },
    },
  });

  // Fire-and-forget: run analysis asynchronously
  // NOTE: In serverless (Vercel), this may be killed after response.
  // For reliability, use /api/internal/process-ai-jobs cron endpoint (Phase 3).
  processAIAnalysis(contentItemId, userId).catch((err) => {
    console.error("[capture] AI analysis failed silently:", err);
  });
}

// ===================================================
// Save URL Content
// ===================================================

export async function saveUrlContent(url: string, reflection?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Basic URL validation
    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname;

    let title = domain;
    let thumbnailUrl = null;

    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "YOHAKU-Bot/1.0" },
        next: { revalidate: 3600 },
      });
      const html = await response.text();

      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch?.[1]) {
        title = titleMatch[1].trim();
      }

      const ogImageMatch =
        html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"[^>]*>/i) ||
        html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:image"[^>]*>/i);
      if (ogImageMatch?.[1]) {
        thumbnailUrl = ogImageMatch[1];
      }
    } catch {
      // Proceed without OG data — saved content is still valid
    }

    const contentItem = await prisma.contentItem.create({
      data: {
        userId: session.user.id,
        type: "url",
        url,
        title,
        domain,
        thumbnailUrl,
        reflection: reflection?.trim() || null,
        aiStatus: "pending",
      },
    });

    // Kick AI analysis in background
    await queueAndRunAI(contentItem.id, session.user.id);

    revalidatePath("/inbox");
    return { success: true, data: contentItem };
  } catch (error) {
    console.error("saveUrlContent error:", error);
    return { success: false, error: "Failed to save URL" };
  }
}

// ===================================================
// Save PDF File
// ===================================================

export async function savePdfFile(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const file = formData.get("file") as File;
    const reflection = formData.get("reflection") as string | null;

    if (!file) {
      throw new Error("No file provided");
    }

    if (file.type !== "application/pdf") {
      throw new Error("Only PDF files are allowed");
    }

    if (file.size > 20 * 1024 * 1024) {
      throw new Error("File size must be less than 20MB");
    }

    const userId = session.user.id;
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");

    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const filePath = `${userId}/${year}/${month}/${Date.now()}_${sanitizedFileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from("yohaku-content")
      .upload(filePath, buffer, { contentType: "application/pdf", upsert: false });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      throw new Error("Failed to upload file to storage");
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from("yohaku-content").getPublicUrl(filePath);

    const contentItem = await prisma.contentItem.create({
      data: {
        userId,
        type: "pdf",
        fileUrl: publicUrl,
        fileName: file.name,
        fileSize: file.size,
        title: file.name.replace(/\.pdf$/i, ""),
        reflection: reflection?.trim() || null,
        aiStatus: "pending",
      },
    });

    // Kick AI analysis in background
    await queueAndRunAI(contentItem.id, userId);

    revalidatePath("/inbox");
    return { success: true, data: contentItem };
  } catch (error) {
    console.error("savePdfFile error:", error);
    return { success: false, error: "Failed to upload PDF" };
  }
}
