import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { pcmToWav } from "../../lib/audio/wav.ts";

test("PCM audio is wrapped in a valid mono 24kHz WAV header", () => {
  const pcm = Buffer.alloc(480);
  const wav = pcmToWav(pcm);
  assert.equal(wav.toString("ascii", 0, 4), "RIFF");
  assert.equal(wav.toString("ascii", 8, 12), "WAVE");
  assert.equal(wav.readUInt16LE(22), 1);
  assert.equal(wav.readUInt32LE(24), 24_000);
  assert.equal(wav.readUInt32LE(40), pcm.length);
});

test("audio briefs use managed Gemini TTS while retaining the user's text provider", () => {
  const route = readFileSync(new URL("../../app/api/yui/brief-audio/route.ts", import.meta.url), "utf8");
  const tts = readFileSync(new URL("../../lib/audio/gemini-tts.ts", import.meta.url), "utf8");
  assert.match(route, /generateText\([^]*userId: session\.id/);
  assert.match(route, /generateQuietAudio\(script, session\.id\)/);
  assert.match(tts, /gemini-2\.5-flash-preview-tts/);
  assert.match(tts, /process\.env\.MANAGED_GEMINI_API_KEY \?\? process\.env\.GEMINI_API_KEY/);
  assert.doesNotMatch(route, /GOOGLE_TTS_API_KEY/);
});

test("generated audio is returned by URL instead of exceeding serverless JSON limits", () => {
  const route = readFileSync(new URL("../../app/api/yui/brief-audio/route.ts", import.meta.url), "utf8");
  const client = readFileSync(new URL("../../components/yui/BriefAudio.tsx", import.meta.url), "utf8");
  const tts = readFileSync(new URL("../../lib/audio/gemini-tts.ts", import.meta.url), "utf8");
  assert.match(route, /audioIds/);
  assert.match(client, /data\.audioIds/);
  assert.doesNotMatch(client, /atob\(/);
  assert.match(tts, /createSignedUrl/);
  assert.doesNotMatch(tts, /getPublicUrl/);
  assert.match(route, /audioReflection\.create/);
  assert.match(client, /audioIds/);
  assert.doesNotMatch(client, />\{index \+ 1\}章</);
});
