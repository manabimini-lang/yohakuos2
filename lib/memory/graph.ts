import { prisma } from "@/lib/prisma";

const PHRASE_MARKERS = [
  "ではなく",
  "ことが大切",
  "ように思う",
  "を感じた",
  "ために",
  "静かな蓄積",
  "学び",
  "価値",
  "違い",
  "つながる",
];

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function collectKeywords(text: string): string[] {
  return Array.from(
    new Set(
      normalizeText(text)
        .split(" ")
        .filter((token) => token.length >= 3)
    )
  );
}

function calculateOverlapScore(source: string, target: string): number {
  const sourceKeywords = collectKeywords(source);
  const targetKeywords = collectKeywords(target);
  if (sourceKeywords.length === 0 || targetKeywords.length === 0) return 0;

  const shared = sourceKeywords.filter((keyword) => targetKeywords.includes(keyword));
  return shared.length / Math.max(sourceKeywords.length, targetKeywords.length);
}

function determineEdgeType(sourceType: string, targetType: string, overlapScore: number, longGap: boolean): string {
  if (sourceType === targetType && sourceType === "life_theme") {
    return "theme_similarity";
  }

  if (sourceType === "reflection" || targetType === "reflection") {
    return "reflection_connection";
  }

  if (longGap && overlapScore >= 0.18) {
    return "timeline_resonance";
  }

  if (
    overlapScore >= 0.25 &&
    ["life_theme", "value", "belief", "motivation"].includes(sourceType) &&
    ["life_theme", "value", "belief", "motivation"].includes(targetType)
  ) {
    return "philosophy_overlap";
  }

  if (
    (sourceType.startsWith("learning") && targetType === "life_theme") ||
    (targetType.startsWith("learning") && sourceType === "life_theme")
  ) {
    return "learning_progression";
  }

  return overlapScore >= 0.2 ? "theme_similarity" : "memory_similarity";
}

function buildEdgeReason(edgeType: string, hasMarker: boolean, longGap: boolean): string {
  const reasons: string[] = [];
  if (edgeType === "reflection_connection") {
    reasons.push("内省と記録のつながり");
  }
  if (edgeType === "timeline_resonance") {
    reasons.push("時間を超えた再接続");
  }
  if (edgeType === "philosophy_overlap") {
    reasons.push("繰り返し現れる価値観");
  }
  if (edgeType === "learning_progression") {
    reasons.push("学びとテーマの橋渡し");
  }
  if (edgeType === "theme_similarity") {
    reasons.push("共通するテーマや言葉");
  }
  if (hasMarker) {
    reasons.push("静かな言葉の共鳴");
  }
  if (reasons.length === 0) {
    reasons.push("記憶の静かな共鳴");
  }
  return reasons.join("、");
}

function calculateWeight(overlapScore: number, sameType: boolean, timeGapDays: number, markerMatch: boolean): number {
  const typeBonus = sameType ? 0.14 : 0.07;
  const timeBonus = timeGapDays >= 90 ? 0.12 : timeGapDays <= 30 ? 0.08 : 0.04;
  const markerBonus = markerMatch ? 0.12 : 0;
  const weight = Math.min(1, overlapScore * 0.45 + typeBonus + timeBonus + markerBonus);
  return Math.max(0, weight);
}

export async function generateMemoryEdges(userId: string, newMemoryIds: string[] = []) {
  const memories = await prisma.userMemory.findMany({
    where: { userId, confidence: { gte: 0.3 } },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, title: true, content: true, type: true, confidence: true, createdAt: true },
  });

  if (memories.length < 2) return;

  const newMemories = newMemoryIds.length > 0
    ? memories.filter((item) => newMemoryIds.includes(item.id))
    : memories.slice(0, 10);

  const existingMemories = memories.filter((item) => !newMemoryIds.includes(item.id));
  if (existingMemories.length === 0) return;

  const edgeUpdates = [];

  for (const source of newMemories) {
    for (const target of existingMemories) {
      if (source.id === target.id) continue;

      const overlapScore = Math.max(
        calculateOverlapScore(source.title ?? "", target.title ?? ""),
        calculateOverlapScore(source.content ?? "", target.content ?? "")
      );
      if (overlapScore < 0.08) continue;

      const sameType = source.type === target.type;
      const timeGapDays = Math.abs(source.createdAt.getTime() - target.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const longGap = timeGapDays >= 90;
      const sourceText = `${source.title} ${source.content}`;
      const targetText = `${target.title} ${target.content}`;
      const markerMatch = PHRASE_MARKERS.some(
        (marker) => sourceText.includes(marker) && targetText.includes(marker)
      );
      const weight = calculateWeight(overlapScore, sameType, timeGapDays, markerMatch);
      if (weight < 0.18) continue;

      const edgeType = determineEdgeType(source.type, target.type, overlapScore, longGap);
      const reason = buildEdgeReason(edgeType, markerMatch, longGap);

      edgeUpdates.push(prisma.memoryGraphEdge.upsert({
        where: {
          userId_fromContentId_toContentId_edgeType: {
            userId,
            fromContentId: source.id,
            toContentId: target.id,
            edgeType,
          },
        },
        update: {
          weight: Math.max(weight, 0.05),
          reason,
        },
        create: {
          userId,
          fromContentId: source.id,
          toContentId: target.id,
          edgeType,
          weight,
          reason,
        },
      }));
    }
  }

  try {
    await Promise.all(edgeUpdates);
  } catch (error) {
    console.error("Memory graph generation failed:", error);
  }
}

export async function decayMemoryGraph(userId: string) {
  const decayCutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const staleEdges = await prisma.memoryGraphEdge.findMany({
    where: { userId, createdAt: { lte: decayCutoff }, weight: { gt: 0.12 } },
    select: { id: true, weight: true },
  });

  const updates = staleEdges.map((edge) =>
    prisma.memoryGraphEdge.update({
      where: { id: edge.id },
      data: { weight: Math.max(0.05, edge.weight * 0.88) },
    })
  );

  if (updates.length > 0) {
    await Promise.all(updates);
  }
}

export async function getMemoryConstellation(userId: string, limit: number = 8) {
  const edges = await prisma.memoryGraphEdge.findMany({
    where: { userId },
    orderBy: { weight: "desc" },
    take: limit,
    select: {
      id: true,
      fromContentId: true,
      toContentId: true,
      edgeType: true,
      weight: true,
      reason: true,
    },
  });

  const ids = Array.from(new Set(edges.flatMap((edge) => [edge.fromContentId, edge.toContentId])));
  const nodes = await prisma.userMemory.findMany({
    where: { id: { in: ids } },
    select: { id: true, title: true, type: true },
  });
  const nodesById = new Map(nodes.map((node) => [node.id, node]));

  return edges.map((edge) => ({
    id: edge.id,
    from: nodesById.get(edge.fromContentId) ?? { id: edge.fromContentId, title: "記録", type: "unknown" },
    to: nodesById.get(edge.toContentId) ?? { id: edge.toContentId, title: "記録", type: "unknown" },
    edgeType: edge.edgeType,
    weight: edge.weight,
    reason: edge.reason,
  }));
}

export async function getPhilosophyFragments(userId: string, limit: number = 4) {
  return prisma.philosophyFragment.findMany({
    where: { userId },
    orderBy: { resonanceScore: "desc" },
    take: limit,
  });
}

export async function getThemeDrift(userId: string) {
  const snapshots = await prisma.memorySnapshot.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 2,
    select: { period: true, themes: true },
  });

  if (snapshots.length < 2) return null;

  const [latest, previous] = snapshots;
  const parseThemeTitles = (themes: any): string[] => {
    if (!Array.isArray(themes)) return [];
    return themes
      .map((item) => (item?.title ? item.title : item?.name ? item.name : String(item)))
      .filter(Boolean);
  };

  const latestThemes = parseThemeTitles(latest.themes);
  const previousThemes = parseThemeTitles(previous.themes);

  const gained = latestThemes.filter((theme) => !previousThemes.includes(theme));
  const faded = previousThemes.filter((theme) => !latestThemes.includes(theme));

  if (!gained.length && !faded.length) return null;

  const gainedText = gained.length > 0 ? `最近は、「${gained.join('」「')}」への関心が増えています。` : "";
  const fadedText = faded.length > 0 ? `以前は「${faded.join('」「')}」が多かったようです。` : "";

  return `${fadedText}${gainedText}`.trim();
}
