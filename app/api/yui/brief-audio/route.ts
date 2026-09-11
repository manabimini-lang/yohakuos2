import { NextResponse } from "next/server";
import { getCurrentSession } from "@/core/auth/server";
import { prisma } from "@/lib/prisma";
import { hasPremiumAccess } from "@/lib/constants/plan";
import { generateText, reserveMonthlyRequest, releaseMonthlyRequest } from "@/lib/ai/gemini";
import { generateNotificationPreview } from "@/app/ui/backend/yui/notification_delivery_service";
import { listYuiMemories } from "@/app/ui/backend/yui/service";
import { getNotificationSettings } from "@/app/ui/backend/yui/notification_service";
import { buildAudioScriptPrompt } from "@/lib/audio/brief-script";
import { recentBriefs } from "@/app/ui/backend/yui/brief-history";
import { generateQuietAudio, GEMINI_TTS_DETAILS } from "@/lib/audio/gemini-tts";
import { storedAudioReference } from "@/lib/audio/audio-history";

export const maxDuration = 300;

export async function POST(request: Request) {
  let reservation: string | undefined;
  let synthesisStarted = false;
  const scripts: string[] = [];
  const audioUrls: string[] = [];
  const audioIds: string[] = [];
  try {
    const session = await getCurrentSession();
    if (!session?.id) return NextResponse.json({ error: "ログインしてください。" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { id: session.id }, select: { plan: true, role: true } });
    if (!hasPremiumAccess(user?.plan, user?.role)) return NextResponse.json({ error: "音声はPremiumで利用できます。" }, { status: 403 });
    if (!process.env.MANAGED_GEMINI_API_KEY && !process.env.GEMINI_API_KEY) return NextResponse.json({ error: "音声は準備中です。管理者のAI接続設定が必要です。" }, { status: 503 });
    const body = await request.json().catch(() => ({}));
    if (![1, 3, 5].includes(body.minutes) || !["morning", "evening"].includes(body.type)) return NextResponse.json({ error: "長さとまとめの種類を選んでください。" }, { status: 400 });
    const settings = await getNotificationSettings(session.id);
    const [brief, memories, previousBriefs] = await Promise.all([
      generateNotificationPreview(session.id, body.type, { useAi: false, timeZone: settings.timezone }),
      listYuiMemories(session.id, 12),
      recentBriefs(session.id),
    ]);
    const evidence = JSON.stringify({ date: brief.generatedAt, brief: brief.message.slice(0, 2600), previousBriefs: previousBriefs.slice(0, 2), pastRecords: memories.map(m => ({ date: m.created_at, title: m.title.slice(0, 80), content: (m.summary || m.body || "").slice(0, 200) })) });
    // Narration generation is metered by the normal Gemini request guardrails.
    for (let index = 0; index < (body.minutes === 5 ? 4 : body.minutes); index++) {
      if (request.signal.aborted) throw new Error("Request cancelled");
      const result = await generateText(evidence, buildAudioScriptPrompt(body.minutes, index, scripts), { userId: session.id, taskClass: "standard" });
      if (!result.text.trim()) break;
      scripts.push(result.text.trim());
    }
    if (!scripts.length) return NextResponse.json({ error: "音声にまとめる材料がまだありません。今日の記録を一言残してください。" }, { status: 422 });
    // One additional reservation meters the bounded TTS job (at most five parts).
    // This also avoids a second per-minute reservation for every audio segment.
    reservation = await reserveMonthlyRequest(session.id, GEMINI_TTS_DETAILS.model);
    for (const script of scripts) {
      if (request.signal.aborted) throw new Error("Request cancelled");
      if (Buffer.byteLength(script, "utf8") > 4500) throw new Error("Audio script too long");
      synthesisStarted = true;
      const audio = await generateQuietAudio(script, session.id);
      if (!audio) throw new Error("TTS failed");
      audioUrls.push(audio.signedUrl);
      const reflection = await prisma.audioReflection.create({
        data: {
          userId: session.id,
          script: scripts.length > 1 ? `第${audioUrls.length}章\n\n${script}` : script,
          audioUrl: storedAudioReference(audio.path),
          voiceProvider: "gemini",
          voiceModel: GEMINI_TTS_DETAILS.model,
          duration: Math.max(1, Math.round((body.minutes * 60) / scripts.length)),
          status: "completed",
        },
      });
      audioIds.push(reflection.id);
    }
    await prisma.yuiEvent.update({ where: { id: reservation }, data: { metadata: { status: "completed", model: GEMINI_TTS_DETAILS.model, characters: scripts.join("").length } } });
    return NextResponse.json({ audioUrls, audioIds, scripts }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[yui/brief-audio] generation failed", error instanceof Error ? error.message : error);
    if (!synthesisStarted) await releaseMonthlyRequest(reservation);
    else if (reservation) {
      // A provider request may be billed even if the response was interrupted.
      await prisma.yuiEvent.update({ where: { id: reservation }, data: { metadata: { status: "partial_or_failed", model: GEMINI_TTS_DETAILS.model, completedParts: audioUrls.length } } }).catch(() => undefined);
    }
    if (scripts.length) return NextResponse.json({
      audioUrls, audioIds, scripts,
      warning: audioUrls.length
        ? `音声は${audioUrls.length}章まで完成しました。続きは原稿で読めます。生成済み分はAI利用枠に計上されます。`
        : "音声を完成できませんでした。生成済みの原稿を表示します。原稿生成分はAI利用枠に計上されます。",
    }, { headers: { "Cache-Control": "private, no-store" } });
    return NextResponse.json({ error: "音声を完成できませんでした。利用上限や接続状況を確認してください。生成済み原稿のAI利用は計上されます。" }, { status: 503 });
  }
}
