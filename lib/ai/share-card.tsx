"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Loader2, Check } from "lucide-react";
import { shareToDiscordAction } from "@/lib/actions/share/share-actions";
import { ThemeType, ContextType } from "@prisma/client";

interface ShareCardProps {
  themes: ThemeType[];
  contexts: ContextType[];
  reflection: string;
  markdown: string;
}

export function ShareCard({ markdown }: ShareCardProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [shared, setShared] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      await shareToDiscordAction(markdown);
      setShared(true);
      setTimeout(() => setShared(false), 3000);
    } catch (error) {
      console.error(error);
      alert("共有に失敗しました");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Preview</h2>
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 text-xs font-mono whitespace-pre-wrap leading-relaxed border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
          {markdown}
        </div>
      </div>

      <Button
        onClick={handleShare}
        disabled={isSharing || shared}
        className="w-full h-12 rounded-2xl gap-2"
        variant={shared ? "secondary" : "primary"}
      >
        {isSharing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : shared ? (
          <Check className="w-4 h-4" />
        ) : (
          <Share2 className="w-4 h-4" />
        )}
        {isSharing ? "共有中..." : shared ? "共有しました" : "Discordに共有する"}
      </Button>
    </Card>
  );
}