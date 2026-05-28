import { prisma } from "@/lib/prisma";

const PHILOSOPHY_MARKERS = [
  "ではなく",
  "ことが大切",
  "ように思う",
  "を感じた",
  "ために",
  "静かな蓄積",
  "学び",
  "価値",
  "つながる",
  "自然",
  "日常",
];

function normalizePhrase(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

function scorePhrase(fragment: string, markerMatch: boolean, frequency: number): number {
  const base = Math.min(1, 0.2 + frequency * 0.15);
  const markerBonus = markerMatch ? 0.25 : 0;
  return Math.min(1, base + markerBonus);
}

export async function generatePhilosophyFragments(userId: string) {
  const windowStart = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000);

  const reflections = await prisma.contentItem.findMany({
    where: {
      userId,
      memoryState: "active",
      reflection: { not: null },
      createdAt: { gte: windowStart },
    },
    select: { reflection: true, aiTags: true },
    orderBy: { createdAt: "desc" },
    take: 120,
  });

  const companionMessages = await prisma.companionMessage.findMany({
    where: {
      conversation: { userId },
      role: "user",
      createdAt: { gte: windowStart },
    },
    select: { content: true },
    orderBy: { createdAt: "desc" },
    take: 80,
  });

  const snapshots = await prisma.memorySnapshot.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 4,
    select: { themes: true },
  });

  const learningSuggestions = await prisma.learningSuggestion.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 60,
    select: { reason: true },
  });

  const candidates = new Map<string, { sourceType: string; relatedTheme?: string; count: number; markerMatch: boolean }>();

  const addCandidate = (text: string, sourceType: string, relatedTheme?: string) => {
    const fragment = normalizePhrase(text);
    if (fragment.length < 20) return;

    const markerMatch = PHILOSOPHY_MARKERS.some((marker) => fragment.includes(marker));
    const existing = candidates.get(fragment);
    const count = existing ? existing.count + 1 : 1;

    candidates.set(fragment, {
      sourceType,
      relatedTheme: relatedTheme || existing?.relatedTheme,
      count,
      markerMatch: existing ? existing.markerMatch || markerMatch : markerMatch,
    });
  };

  reflections.forEach((item) => {
    if (!item.reflection) return;
    const text = item.reflection.trim();
    if (text.length === 0) return;

    const lines = text.split(/[\n\.。]+/).map((line) => line.trim()).filter(Boolean);
    lines.slice(0, 4).forEach((line) => {
      if (line.length < 30) return;
      const tag = item.aiTags?.[0] || "人生";
      addCandidate(line, "reflection", tag);
    });
  });

  companionMessages.forEach((item) => {
    const lines = item.content.split(/[\n\.。]+/).map((line) => line.trim()).filter(Boolean);
    lines.slice(0, 3).forEach((line) => {
      if (line.length < 30) return;
      addCandidate(line, "companion", "対話");
    });
  });

  learningSuggestions.forEach((item) => {
    if (!item.reason) return;
    addCandidate(item.reason, "learning_pattern", "学び");
  });

  snapshots.forEach((snapshot) => {
    const themes = Array.isArray(snapshot.themes) ? snapshot.themes : [];
    themes.slice(0, 3).forEach((theme: any) => {
      const title = theme?.title || theme?.name || String(theme);
      if (!title) return;
      addCandidate(`最近の記録は「${title}」を静かな蓄積として扱っています。`, "memory_snapshot", title);
    });
  });

  const items = Array.from(candidates.entries())
    .map(([fragment, meta]) => ({
      fragment,
      sourceType: meta.sourceType,
      relatedTheme: meta.relatedTheme,
      score: scorePhrase(fragment, meta.markerMatch, meta.count),
    }))
    .filter((item) => item.score >= 0.35)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const persisted: Array<{ id: string; fragment: string; sourceType: string; resonanceScore: number; relatedTheme?: string }> = [];

  for (const item of items) {
    const record = await prisma.philosophyFragment.upsert({
      where: { userId_fragment: { userId, fragment: item.fragment } },
      update: {
        resonanceScore: item.score,
        sourceType: item.sourceType,
        relatedTheme: item.relatedTheme,
      },
      create: {
        userId,
        fragment: item.fragment,
        sourceType: item.sourceType,
        resonanceScore: item.score,
        relatedTheme: item.relatedTheme,
      },
    });

    persisted.push({
      id: record.id,
      fragment: record.fragment,
      sourceType: record.sourceType,
      resonanceScore: record.resonanceScore,
      relatedTheme: record.relatedTheme ?? undefined,
    });
  }

  return persisted;
}

export async function getLatestPhilosophyFragments(userId: string, limit: number = 4) {
  return prisma.philosophyFragment.findMany({
    where: { userId },
    orderBy: { resonanceScore: "desc" },
    take: limit,
  });
}
