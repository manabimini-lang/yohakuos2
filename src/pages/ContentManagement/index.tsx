import { useState, useEffect } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Content } from "@/types";
import { ContentForm } from "./ContentForm";
import { ContentList } from "./ContentList";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

// Mock data for UI testing
const MOCK_CONTENT: Content[] = [
  {
    id: "1",
    title: "教育コミュニティの余白デザイン",
    description: "先生たちが呼吸できる場所を作るための最初の一歩。",
    thumbnail_url: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=400",
    external_url: "https://note.com",
    category: "記事",
    layer: "public",
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    title: "ICT活用ワークショップ録画",
    description: "iPadを使った探究学習の進め方についての実践事例。",
    thumbnail_url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=400",
    external_url: "https://youtube.com",
    category: "動画",
    layer: "member",
    is_published: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export default function ContentManagement() {
  const [contents, setContents] = useState<Content[]>(MOCK_CONTENT);
  const [isAdding, setIsAdding] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredContents = contents.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "all" || 
                          (filter === "published" && c.is_published) || 
                          (filter === "draft" && !c.is_published);
    return matchesSearch && matchesFilter;
  });

  const handleDelete = (id: string) => {
    setContents(prev => prev.filter(c => c.id !== id));
    toast.success("コンテンツを削除しました。");
  };

  const handleTogglePublish = (id: string) => {
    setContents(prev => prev.map(c => 
      c.id === id ? { ...c, is_published: !c.is_published } : c
    ));
    toast.success("公開ステータスを更新しました。");
  };

  const handleSave = (data: Partial<Content>) => {
    if (editingContent) {
      setContents(prev => prev.map(c => 
        c.id === editingContent.id ? { ...c, ...data as Content, updated_at: new Date().toISOString() } : c
      ));
      toast.success("更新しました。");
    } else {
      const newContent: Content = {
        id: Math.random().toString(36).substr(2, 9),
        ...data as Content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_published: data.is_published ?? false,
      };
      setContents(prev => [newContent, ...prev]);
      toast.success("作成しました。");
    }
    setIsAdding(false);
    setEditingContent(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">コンテンツ作成</h1>
          <p className="text-muted-foreground text-sm">noteやSNSに投稿する感覚で、コミュニティのリソースを管理できます。</p>
        </div>
        <Button 
          onClick={() => setIsAdding(true)}
          className="bg-brand hover:bg-brand/90 text-white gap-2 font-bold px-6 h-12 rounded-full shadow-lg shadow-brand/20 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="h-5 w-5" />
          新規作成
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {(isAdding || editingContent) ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-none shadow-xl ring-1 ring-border/50">
              <CardHeader className="border-b bg-notion-bg/30">
                <CardTitle className="text-xl">
                  {editingContent ? "コンテンツを編集" : "新しいコンテンツを追加"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ContentForm 
                  initialData={editingContent || undefined}
                  onSave={handleSave}
                  onCancel={() => {
                    setIsAdding(false);
                    setEditingContent(null);
                  }}
                />
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="タイトルで検索..." 
                  className="pl-10 h-11 bg-white border-border/50 focus:ring-brand/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Tabs value={filter} onValueChange={setFilter} className="w-full">
                  <TabsList className="bg-notion-bg h-11 p-1">
                    <TabsTrigger value="all" className="px-6 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">すべて</TabsTrigger>
                    <TabsTrigger value="published" className="px-6 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">公開中</TabsTrigger>
                    <TabsTrigger value="draft" className="px-6 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">下書き</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <ContentList 
              contents={filteredContents}
              onEdit={setEditingContent}
              onDelete={handleDelete}
              onTogglePublish={handleTogglePublish}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
