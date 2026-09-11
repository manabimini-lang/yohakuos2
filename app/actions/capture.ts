"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { processAIAnalysis } from "./ai-processing";
import { getExpiresAt } from "@/lib/services/retention.service";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { completeMonthlyRequest, getApiCredentials, releaseMonthlyRequest, reserveMonthlyRequest } from "@/lib/ai/gemini";

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

    const expiresAt = await getExpiresAt(session.user.id);

    const contentItem = await prisma.contentItem.create({
      data: {
        userId: session.user.id,
        type: "url",
        url,
        title,
        domain,
        thumbnailUrl,
        reflection: reflection?.trim() || null,
        expiresAt,
      },
    });


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

    const supabaseAdmin = getSupabaseAdmin();

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

    const expiresAt = await getExpiresAt(userId);

    const contentItem = await prisma.contentItem.create({
      data: {
        userId,
        type: "pdf",
        fileUrl: publicUrl,
        fileName: file.name,
        fileSize: file.size,
        title: file.name.replace(/\.pdf$/i, ""),
        reflection: reflection?.trim() || null,
        expiresAt,
      },
    });


    // Kick AI analysis in background
    await queueAndRunAI(contentItem.id, userId);

    revalidatePath("/inbox");
    return { success: true, data: contentItem };
  } catch (error) {
    console.error("savePdfFile error:", error);
    return { success: false, error: "Server error", errorCode: "server" };
  }
}

// ===================================================
// Save Photo Capture
// ===================================================

export async function savePhotoFile(formData: FormData): Promise<{
  success: boolean;
  data?: object;
  error?: string;
  errorCode?: "invalid_file" | "too_large" | "upload" | "server";
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized", errorCode: "server" };
    }

    const file = formData.get("file") as File | null;
    const reflection = formData.get("reflection") as string | null;
    if (!file || !file.type.startsWith("image/")) {
      return { success: false, error: "画像ファイルを選んでください", errorCode: "invalid_file" };
    }
    if (file.size > 15 * 1024 * 1024) {
      return { success: false, error: "写真は15MB以下にしてください", errorCode: "too_large" };
    }

    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const extension = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "jpg";
    const filePath = `${session.user.id}/${year}/${month}/${Date.now()}_photo.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const supabaseAdmin = getSupabaseAdmin();
    const { error: uploadError } = await supabaseAdmin.storage
      .from("yohaku-content")
      .upload(filePath, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error("Supabase photo upload error:", uploadError);
      return { success: false, error: "写真を保存できませんでした", errorCode: "upload" };
    }

    const { data: publicData } = supabaseAdmin.storage.from("yohaku-content").getPublicUrl(filePath);
    const expiresAt = await getExpiresAt(session.user.id);
    const contentItem = await prisma.contentItem.create({
      data: {
        userId: session.user.id,
        type: "photo",
        fileUrl: publicData.publicUrl,
        fileName: file.name,
        fileSize: file.size,
        title: `写真 ${date.toLocaleString("ja-JP")}`,
        reflection: reflection?.trim() || null,
        thumbnailUrl: publicData.publicUrl,
        expiresAt,
      },
    });

    revalidatePath("/inbox");
    return { success: true, data: contentItem };
  } catch (error) {
    console.error("savePhotoFile error:", error);
    return { success: false, error: "写真を保存できませんでした", errorCode: "server" };
  }
}

export async function analyzePhotoContent(contentItemId: string): Promise<{
  success: boolean;
  summary?: string;
  tags?: string[];
  error?: string;
}> {
  let reservationId: string | undefined;
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    const item = await prisma.contentItem.findFirst({
      where: { id: contentItemId, userId: session.user.id, type: "photo" },
    });
    if (!item?.fileUrl) return { success: false, error: "写真が見つかりません" };

    const imageResponse = await fetch(item.fileUrl);
    if (!imageResponse.ok) throw new Error("写真を読み込めませんでした");
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    if (imageBuffer.byteLength > 10 * 1024 * 1024) throw new Error("写真は10MB以下にしてください");
    const mimeType = imageResponse.headers.get("content-type")?.split(";")[0] || "image/jpeg";
    const { apiKey, modelName, source, provider } = await getApiCredentials({ userId: session.user.id, allowEnvFallback: true, taskClass: "standard" });
    if (provider !== "gemini") {
      return { success: false, error: "写真のAI整理は現在Gemini接続で利用できます。Groqではテキストの相談・要約をご利用ください。" };
    }
    reservationId = await reserveMonthlyRequest(session.user.id, modelName);
    const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: modelName });
    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [
          { text: "この写真をYUIの記録用に静かに整理してください。写っている主なもの・状況・読み取れる文字を、断定しすぎず日本語で要約してください。JSONのみで、summary（120文字以内）、tags（3〜5個の短いタグ）、visibleText（読める文字。なければ空文字）を返してください。" },
          { inlineData: { mimeType, data: imageBuffer.toString("base64") } },
        ],
      }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
    });
    const raw = result.response.text();
    const usageMetadata = result.response.usageMetadata;
    const inputTokens = usageMetadata?.promptTokenCount ?? 2_000;
    const totalTokens = usageMetadata?.totalTokenCount ?? inputTokens + (usageMetadata?.candidatesTokenCount ?? Math.ceil(raw.length / 4));
    await completeMonthlyRequest(reservationId, session.user.id, {
      inputTokens,
      outputTokens: Math.max(usageMetadata?.candidatesTokenCount ?? 0, totalTokens - inputTokens),
      totalTokens,
      model: modelName,
      credentialSource: source,
    });
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse((jsonMatch?.[1] || jsonMatch?.[0] || raw).trim()) as { summary?: string; tags?: string[]; visibleText?: string };
    const summary = String(parsed.summary || "写真を記録しました").slice(0, 120);
    const tags = Array.isArray(parsed.tags) ? parsed.tags.map(String).slice(0, 5) : [];
    const metadata = item.metadata && typeof item.metadata === "object" && !Array.isArray(item.metadata) ? item.metadata : {};
    await prisma.contentItem.update({
      where: { id: item.id },
      data: {
        summary,
        aiTags: tags,
        contentType: "image",
        meaningStatus: "completed",
        aiProcessedAt: new Date(),
        metadata: { ...metadata, visualAnalysis: { summary, tags, visibleText: String(parsed.visibleText || "").slice(0, 500) } },
      },
    });
    reservationId = undefined;
    revalidatePath("/inbox");
    return { success: true, summary, tags };
  } catch (error) {
    await releaseMonthlyRequest(reservationId);
    console.error("analyzePhotoContent error:", error);
    return { success: false, error: "写真の解析に失敗しました。AI設定と通信状態を確認してください。" };
  }
}
