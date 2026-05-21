import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
export const dynamic = "force-dynamic";

type DiscordFeedItem = {
  id: string;
  author: string;
  content: string;
  created_at: string;
};

// Simple in-memory cache to prevent rate-limiting the Discord API
let feedCache: {
  data: DiscordFeedItem[];
  timestamp: number;
} | null = null;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

// Mock fallback feed to show if Discord Bot is not configured or fails
const MOCK_FEED: DiscordFeedItem[] = [
  {
    id: "mock-1",
    author: "めぐみ",
    content: "今日の小さな実践：朝起きてすぐスマホを見ず、窓を開けて深呼吸を3回した。少し頭がすっきりした気がする。",
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-2",
    author: "たかし",
    content: "仕事の合間に10分だけ散歩。日光を浴びるだけで、なんとなく煮詰まっていたタスクの整理がついた。",
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: "mock-3",
    author: "さくら",
    content: "ノートを1ページ、今の感情で埋め尽くしてみた。綺麗に書こうとせず、ただ吐き出す時間。",
    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
];

export async function GET() {
  noStore();
  try {
    // 1. Check if cache is still valid
    if (feedCache && (Date.now() - feedCache.timestamp < CACHE_TTL)) {
      return NextResponse.json(feedCache.data);
    }

    const botToken = process.env.DISCORD_BOT_TOKEN;
    const channelId = process.env.DISCORD_CHANNEL_ID;

    // 2. Return mock fallback if config is missing
    if (!botToken || !channelId) {
      console.warn("DISCORD_BOT_TOKEN or DISCORD_CHANNEL_ID is not set. Returning mock feed data.");
      return NextResponse.json(MOCK_FEED);
    }

    // 3. Fetch from Discord API
    const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages?limit=5`, {
      method: "GET",
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
      },
      // Short timeout to keep API fast
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Discord API fetch failed with status ${response.status}: ${errText}`);
      // Fallback to cache if available, else mock data
      if (feedCache) {
        return NextResponse.json(feedCache.data);
      }
      return NextResponse.json(MOCK_FEED);
    }

    const messages = await response.json();
    
    if (!Array.isArray(messages)) {
      throw new Error("Discord API response is not an array");
    }

    // 4. Map to requested format
    const mappedFeed: DiscordFeedItem[] = messages.slice(0, 5).map((msg: any) => ({
      id: msg.id,
      author: msg.author.global_name || msg.author.username || "Anonymous",
      content: msg.content || "",
      created_at: msg.timestamp || new Date().toISOString(),
    }));

    // 5. Update Cache
    feedCache = {
      data: mappedFeed,
      timestamp: Date.now(),
    };

    return NextResponse.json(mappedFeed);
  } catch (error) {
    console.error("[DISCORD_FEED_API_ERROR]", error);
    // Safe fallback to mock feed on exception
    return NextResponse.json(feedCache?.data || MOCK_FEED);
  }
}
