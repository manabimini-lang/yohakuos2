import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

type RecommendationRequest = {
  road: string;
  tags?: string[];
  logs?: string[];
};

// Normalize client road key to DB road title
function normalizeRoad(road: string): string {
  const r = road.toLowerCase();
  if (r === "beginner" || r === "初任者") return "初任者ロード";
  if (r === "side-hustle" || r === "sidejob" || r === "副業") return "副業ロード";
  if (r === "resignation" || r === "retirement" || r === "退職") return "退職ロード";
  return road;
}

// Simple Japanese keyword extractor from logs
function extractKeywords(logs: string[]): string[] {
  if (!logs || logs.length === 0) return [];
  const text = logs.join(" ");
  // Simple word splitter for common Japanese topics/nouns (peaceful contexts)
  const commonKeywords = [
    "焦り", "不安", "人間関係", "キャリア", "睡眠", "休息", "時間", 
    "習慣", "目標", "体調", "ストレス", "勉強", "成長", "余白"
  ];
  return commonKeywords.filter(keyword => text.includes(keyword));
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body: RecommendationRequest = await req.json();
    const { road, tags = [], logs = [] } = body;

    if (!road) {
      return new NextResponse("Missing road parameter", { status: 400 });
    }

    const targetRoad = normalizeRoad(road);
    const keywords = extractKeywords(logs);
    const lowercaseTags = tags.map(t => t.toLowerCase());

    // 1. Fetch all items from Database
    const [allKnowledge, allExternal] = await Promise.all([
      prisma.sharedKnowledge.findMany(),
      prisma.externalContent.findMany(),
    ]);

    // 2. Score and Sort SharedKnowledge
    const scoredKnowledge = allKnowledge.map((item) => {
      let score = 0;

      // Rule 1: Same road (highest priority)
      if (item.road === targetRoad) {
        score += 100;
      }

      // Rule 2: Close tags (medium priority)
      let parsedTags: string[] = [];
      if (Array.isArray(item.tags)) {
        parsedTags = item.tags as string[];
      } else if (typeof item.tags === "string") {
        try {
          parsedTags = JSON.parse(item.tags);
        } catch {
          parsedTags = [];
        }
      }
      const tagMatchCount = parsedTags.filter(t => lowercaseTags.includes(t.toLowerCase())).length;
      score += tagMatchCount * 10;

      // Rule 3: Keyword overlap with logs (lower priority helper)
      keywords.forEach(keyword => {
        if (item.title.includes(keyword) || item.summary.includes(keyword)) {
          score += 5;
        }
      });

      return { item, score };
    });

    // 3. Score and Sort ExternalContent
    const scoredExternal = allExternal.map((item) => {
      let score = 0;

      // Rule 1: Same road
      if (item.road === targetRoad) {
        score += 100;
      }

      // Rule 2: Close tags
      let parsedTags: string[] = [];
      if (Array.isArray(item.tags)) {
        parsedTags = item.tags as string[];
      } else if (typeof item.tags === "string") {
        try {
          parsedTags = JSON.parse(item.tags);
        } catch {
          parsedTags = [];
        }
      }
      const tagMatchCount = parsedTags.filter(t => lowercaseTags.includes(t.toLowerCase())).length;
      score += tagMatchCount * 10;

      // Rule 3: Keyword overlap with logs
      keywords.forEach(keyword => {
        if (item.title.includes(keyword) || (item.description && item.description.includes(keyword))) {
          score += 5;
        }
      });

      return { item, score };
    });

    // Sort descending by score, then by recency (createdAt)
    const sortedKnowledge = scoredKnowledge
      .sort((a, b) => b.score - a.score || new Date(b.item.createdAt).getTime() - new Date(a.item.createdAt).getTime())
      .map(s => s.item)
      .slice(0, 3);

    const sortedExternal = scoredExternal
      .sort((a, b) => b.score - a.score || new Date(b.item.createdAt).getTime() - new Date(a.item.createdAt).getTime())
      .map(s => s.item)
      .slice(0, 3);

    return NextResponse.json({
      relatedKnowledge: sortedKnowledge,
      recommendedContents: sortedExternal,
    });
  } catch (error) {
    console.error("[RECOMMENDATIONS_API_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
