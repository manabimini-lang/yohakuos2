"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { processAIAnalysis } from "./ai-processing";
import { startStarterJourneyIfEligible } from "@/lib/ai/starter-journey";

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

export async function saveUrlContent(url: string, reflection?: string): Promise<{
  success: boolean;
  data?: object;
  error?: string;
  errorCode?: "invalid_url" | "network" | "server";
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized", errorCode: "server" };
    }

    // Basic URL validation
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return { success: false, error: "Invalid URL format", errorCode: "invalid_url" };
    }
    const domain = parsedUrl.hostname;

    let title = domain;
    let thumbnailUrl = null;
    let fetchFailed = false;

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
      fetchFailed = true;
    }

    // If fetch completely failed (DNS / network), the URL may be invalid or unreachable
    if (fetchFailed && !title) {
      return {
        success: false,
        error: "Could not reach URL",
        errorCode: "network",
      };
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
      },
    });

    await startStarterJourneyIfEligible(session.user.id);

    // Kick AI analysis in background
    await queueAndRunAI(contentItem.id, session.user.id);

    revalidatePath("/inbox");
    return { success: true, data: contentItem };
  } catch (error) {
    console.error("saveUrlContent error:", error);
    return { success: false, error: "Server error", errorCode: "server" };
  }
}

// ===================================================
// Save PDF File
// ===================================================

export async function savePdfFile(formData: FormData): Promise<{
  success: boolean;
  data?: object;
  error?: string;
  errorCode?: "invalid_file" | "too_large" | "upload" | "parse" | "server";
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized", errorCode: "server" };
    }

    const file = formData.get("file") as File;
    const reflection = formData.get("reflection") as string | null;

    if (!file) {
      return { success: false, error: "No file provided", errorCode: "invalid_file" };
    }

    if (file.type !== "application/pdf") {
      return {
        success: false,
        error: "Only PDF files are allowed",
        errorCode: "invalid_file",
      };
    }

    if (file.size > 20 * 1024 * 1024) {
      return {
        success: false,
        error: "File too large",
        errorCode: "too_large",
      };
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
      return { success: false, error: "Upload failed", errorCode: "upload" };
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
      },
    });

    await startStarterJourneyIfEligible(userId);

    // Kick AI analysis in background
    await queueAndRunAI(contentItem.id, userId);

    revalidatePath("/inbox");
    return { success: true, data: contentItem };
  } catch (error) {
    console.error("savePdfFile error:", error);
    return { success: false, error: "Server error", errorCode: "server" };
  }
}
