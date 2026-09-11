import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { pcmToWav } from "@/lib/audio/wav";

const GEMINI_TTS_MODEL = "gemini-2.5-flash-preview-tts";
const GEMINI_TTS_VOICE = "Achernar";
const SAMPLE_RATE = 24_000;
const SIGNED_URL_TTL_SECONDS = 60 * 60;

function managedGeminiKey() {
  return process.env.MANAGED_GEMINI_API_KEY ?? process.env.GEMINI_API_KEY ?? null;
}

async function synthesizeWithGemini(script: string): Promise<Buffer> {
  const apiKey = managedGeminiKey();
  if (!apiKey) throw new Error("Managed Gemini API key is not configured");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TTS_MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      signal: AbortSignal.timeout(90_000),
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: `落ち着いた自然な日本語で、少しゆっくり読み上げてください。\n\n${script}` }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: GEMINI_TTS_VOICE } },
          },
        },
      }),
    },
  );

  if (!response.ok) {
    console.warn("[gemini-tts] provider request failed", { status: response.status, model: GEMINI_TTS_MODEL });
    throw new Error(`Gemini TTS request failed (${response.status})`);
  }

  const data = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> } }>;
  };
  const inlineData = data.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data)?.inlineData;
  if (!inlineData?.data) throw new Error("Gemini TTS returned no audio");

  const decoded = Buffer.from(inlineData.data, "base64");
  return inlineData.mimeType?.toLowerCase().includes("wav") ? decoded : pcmToWav(decoded, SAMPLE_RATE);
}

export type GeneratedQuietAudio = {
  path: string;
  signedUrl: string;
};

/** Generate speech and store it outside the serverless response size limit. */
export async function generateQuietAudio(script: string, userId: string): Promise<GeneratedQuietAudio | null> {
  try {
    const audioBuffer = await synthesizeWithGemini(script);
    const fileName = `${userId}/audio-reflections/reflection-${Date.now()}-${crypto.randomUUID()}.wav`;
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.storage
      .from("yohaku-audio")
      .upload(fileName, audioBuffer, { contentType: "audio/wav", upsert: false });
    if (error) throw new Error(`Supabase upload failed: ${error.message}`);

    const { data: urlData, error: urlError } = await supabaseAdmin.storage
      .from("yohaku-audio")
      .createSignedUrl(data.path, SIGNED_URL_TTL_SECONDS);
    if (urlError || !urlData?.signedUrl) {
      await supabaseAdmin.storage.from("yohaku-audio").remove([data.path]).catch(() => undefined);
      throw new Error(`Supabase signed URL failed: ${urlError?.message ?? "URL missing"}`);
    }
    return { path: data.path, signedUrl: urlData.signedUrl };
  } catch (error) {
    console.error("[gemini-tts] Error generating or uploading audio:", error instanceof Error ? error.message : error);
    return null;
  }
}

export const GEMINI_TTS_DETAILS = {
  model: GEMINI_TTS_MODEL,
  voice: GEMINI_TTS_VOICE,
  sampleRate: SAMPLE_RATE,
} as const;
