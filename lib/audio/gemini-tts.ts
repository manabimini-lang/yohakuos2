import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function generateQuietAudio(script: string, userId: string): Promise<string | null> {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.warn("No API key for TTS.");
      return null;
    }

    // Google Cloud Text-to-Speech API
    // Setting up a calm, neutral voice (e.g. Journey voice or Neural2)
    const ttsUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
    
    const requestBody = {
      input: { text: script },
      voice: { 
        languageCode: "ja-JP", 
        name: "ja-JP-Neural2-B" // Calm, neutral tone
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: 0.85, // Slower for quiet reflection
        pitch: -2.0, // Slightly lower, softer
      }
    };

    const response = await fetch(ttsUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`TTS API failed: ${response.status}`);
    }

    const data = await response.json();
    if (!data.audioContent) {
      throw new Error("No audio content returned");
    }

    // audioContent is base64
    const audioBuffer = Buffer.from(data.audioContent, "base64");
    
    // Upload to Supabase Storage
    const timestamp = Date.now();
    const fileName = `${userId}/audio-reflections/reflection-${timestamp}.mp3`;

    const supabaseAdmin = getSupabaseAdmin();

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("yohaku-audio")
      .upload(fileName, audioBuffer, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Supabase upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("yohaku-audio")
      .getPublicUrl(uploadData.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error("[gemini-tts] Error generating or uploading audio:", error);
    return null;
  }
}
