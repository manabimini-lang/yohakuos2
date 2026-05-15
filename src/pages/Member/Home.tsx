import { useState } from "react";
import { 
  Sparkles, 
  Clock, 
  TrendingUp, 
  Library, 
  Filter,
  Search,
  LayoutGrid,
  List as ListIcon,
  ChevronRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContentCard } from "@/components/member/ContentCard";
import { ThemeBanner } from "@/components/member/ThemeBanner";
import { Content, MonthlyTheme, ContentLayer } from "@/types";
import { motion } from "framer-motion";

// Mock Data
const MOCK_THEME: MonthlyTheme = {
  id: "theme-1",
  month_date: "2024-05-01",
  title: "心の余白を、授業の豊かさに。",
  description: "多忙な教員生活の中で、あえて「何もしない時間」をどうデザインするか。5月はマインドフルネスと効率化の両軸で探究します。",
  goal: "放課後の30分を、自分のための「余白」として確保する。"
};

const MOCK_CONTENTS: Content[] = [
  {
    id: "1",
    title: "5分でできる！教室の中のマインドフルネス",
    description: "授業の合間に、生徒と一緒に深呼吸。落ち着いた環境を作るためのショートワーク。",
    thumbnail_url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800",
    category: "動画",
    layer: "public",
    is_published: true,
    created_at: "",
    updated_at: ""
  },
  {
    id: "2",
    title: "Notionで作る、教員のタスク管理術 2024",
    description: "事務作業を半分に。余白を作るための最新デジタルツール活用ガイド。",
    thumbnail_url: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&q=80&w=800",
    category: "教材",
    layer: "member",
    is_published: true,
    created_at: "",
    updated_at: ""
  },
  {
    id: "3",
    title: "【対談】教育に「遊び」を取り戻す",
    description: "現場の先生たちと語る、カリキュラムの隙間にある学びの価値。",
    thumbnail_url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800",
    category: "記事",
    layer: "member",
    is_published: true,
    created_at: "",
    updated_at: ""
  },
  {
    id: "4",
    title: "探究学習の評価、どうしてる？",
    description: "点数化できない学びをどう見取り、フィードバックするか。限定公開の事例集。",
    thumbnail_url: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80&w=800",
    category: "教材",
    layer: "exclusive",
    is_published: true,
    created_at: "",
    updated_at: ""
  },
  {
    id: "5",
    title: "朝の会でのアイスブレイク素材集",
    description: "明日からすぐ使える。生徒との距離が縮まる5分間のアクティビティ。",
    thumbnail_url: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=800",
    category: "教材",
    layer: "public",
    is_published: true,
    created_at: "",
    updated_at: ""
  },
  {
    id: "6",
    title: "教員のメンタルヘルス・リトリート",
    description: "自分自身をケアするための専門家による特別セッション動画。",
    thumbnail_url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800",
    category: "動画",
    layer: "member",
    is_published: true,
    created_at: "",
    updated_at: ""
  }
];

export function MemberHome() {
  const [selectedLayer, setSelectedLayer] = useState<ContentLayer | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredContents = MOCK_CONTENTS.filter(c => {
    const matchesLayer = selectedLayer === "all" || c.layer === selectedLayer;
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLayer && matchesSearch;
  });

  return (
    <div className="space-y-12 pb-20">
      {/* Hero Section: Monthly Theme */}
      <section>
        <ThemeBanner theme={MOCK_THEME} />
      </section>

      {/* Recommendations: Netflix Style Scroll */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
                <Sparkles className="h-4 w-4" />
            </div>
            <h2 className="text-2xl font-black tracking-tight">あなたへのおすすめ</h2>
          </div>
          <button className="text-sm font-bold text-brand hover:underline flex items-center gap-1 group">
            もっと見る
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {MOCK_CONTENTS.slice(0, 3).map((content, i) => (
                <ContentCard key={content.id} content={content} index={i} />
            ))}
        </div>
      </section>

      {/* Content Library */}
      <section className="space-y-8 pt-12 border-t border-border/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-600">
                <Library className="h-4 w-4" />
            </div>
            <h2 className="text-2xl font-black tracking-tight">ライブラリ</h2>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="コンテンツを探す..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 bg-notion-bg border-none shadow-none focus-visible:ring-brand/20"
                />
            </div>
            <Tabs 
                value={selectedLayer} 
                onValueChange={(val) => setSelectedLayer(val as any)}
                className="bg-notion-bg p-1 rounded-lg"
            >
                <TabsList className="bg-transparent h-8 p-0">
                    <TabsTrigger value="all" className="rounded-md px-4 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">ALL</TabsTrigger>
                    <TabsTrigger value="public" className="rounded-md px-4 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">FREE</TabsTrigger>
                    <TabsTrigger value="member" className="rounded-md px-4 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">MEMBER</TabsTrigger>
                </TabsList>
            </Tabs>
          </div>
        </div>

        {filteredContents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                {filteredContents.map((content, i) => (
                    <ContentCard key={content.id} content={content} index={i} />
                ))}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                <div className="h-16 w-16 rounded-full bg-notion-bg flex items-center justify-center mb-4">
                    <Search className="h-8 w-8 opacity-20" />
                </div>
                <p className="font-bold">該当するコンテンツが見つかりません</p>
                <p className="text-sm mt-1">別の条件で試してみてください。</p>
            </div>
        )}

        <div className="flex justify-center pt-10">
            <Button variant="outline" className="rounded-full px-12 h-12 font-bold border-border/50 hover:bg-notion-bg">
                さらに読み込む
            </Button>
        </div>
      </section>
    </div>
  );
}

// Separate component for ChevronRight used above if needed
function ChevronRightIcon({ className }: { className?: string }) {
    return <ChevronRight className={className} />;
}
