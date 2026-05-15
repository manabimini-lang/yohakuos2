import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Content, ContentLayer } from "@/types";

interface ContentFormProps {
  initialData?: Partial<Content>;
  onSave: (data: Partial<Content>) => void;
  onCancel: () => void;
}

export function ContentForm({ initialData, onSave, onCancel }: ContentFormProps) {
  const [formData, setFormData] = useState<Partial<Content>>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    thumbnail_url: initialData?.thumbnail_url || "",
    external_url: initialData?.external_url || "",
    category: initialData?.category || "記事",
    layer: initialData?.layer || "public",
    is_published: initialData?.is_published || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4 md:col-span-2">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-bold">タイトル</Label>
            <Input 
              id="title" 
              placeholder="心に響くタイトルをつけましょう" 
              className="text-lg h-12 border-none shadow-none focus-visible:ring-0 px-0 placeholder:text-muted-foreground/30 font-bold"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-bold">説明文</Label>
            <Textarea 
              id="description" 
              placeholder="このコンテンツの魅力を短く伝えます（Notionやnote風の要約）" 
              className="min-h-[100px] border-none shadow-none focus-visible:ring-0 px-0 resize-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="thumbnail_url" className="text-sm font-bold">サムネイルURL</Label>
          <Input 
            id="thumbnail_url" 
            placeholder="https://images.unsplash.com/..." 
            value={formData.thumbnail_url}
            onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
            className="bg-notion-bg/30"
          />
          {formData.thumbnail_url && (
            <div className="mt-2 h-32 w-full rounded-lg bg-notion-bg overflow-hidden border border-border/50">
              <img 
                src={formData.thumbnail_url} 
                alt="Preview" 
                className="h-full w-full object-cover"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="external_url" className="text-sm font-bold">外部リンク (YouTube / note / Discordなど)</Label>
          <Input 
            id="external_url" 
            placeholder="https://..." 
            value={formData.external_url}
            onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
            className="bg-notion-bg/30"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category" className="text-sm font-bold">カテゴリ</Label>
          <Select 
            value={formData.category} 
            onValueChange={(val) => setFormData({ ...formData, category: val })}
          >
            <SelectTrigger className="bg-notion-bg/30">
              <SelectValue placeholder="カテゴリを選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="記事">記事 (note風)</SelectItem>
              <SelectItem value="動画">動画 (YouTube連携)</SelectItem>
              <SelectItem value="イベント">イベント (Discord周知)</SelectItem>
              <SelectItem value="教材">教材資料</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="layer" className="text-sm font-bold">公開レイヤー（権限）</Label>
          <Select 
            value={formData.layer} 
            onValueChange={(val) => setFormData({ ...formData, layer: val as ContentLayer })}
          >
            <SelectTrigger className="bg-notion-bg/30">
              <SelectValue placeholder="レイヤーを選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">全体公開 (LP共通)</SelectItem>
              <SelectItem value="member">メンバー限定 (ログイン必須)</SelectItem>
              <SelectItem value="exclusive">特別会員のみ</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t">
        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            id="is_published"
            checked={formData.is_published}
            onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
          />
          <Label htmlFor="is_published" className="font-bold cursor-pointer">今すぐ公開する</Label>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" onClick={onCancel}>キャンセル</Button>
          <Button type="submit" className="bg-brand hover:bg-brand/90 text-white font-bold px-8">
            {initialData ? "変更を保存" : "コンテンツを投稿"}
          </Button>
        </div>
      </div>
    </form>
  );
}
