import { Sparkles, Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MonthlyTheme } from "@/types";
import { motion } from "framer-motion";

interface ThemeBannerProps {
  theme: MonthlyTheme;
}

export function ThemeBanner({ theme }: ThemeBannerProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-3xl bg-notion-bg p-8 md:p-12 border border-border/50"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 h-64 w-64 rounded-full bg-brand/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 h-64 w-64 rounded-full bg-purple-500/5 blur-3xl" />

      <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
        <div className="flex-1 space-y-6 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-brand text-xs font-bold uppercase tracking-widest">
            <Calendar className="h-3 w-3" />
            2024年 5月のテーマ
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-notion-text leading-tight">
            {theme.title}
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
            {theme.description}
          </p>

          <div className="flex flex-wrap gap-4 pt-2 justify-center md:justify-start">
            <Button className="bg-brand hover:bg-brand/90 text-white font-bold h-12 px-8 rounded-full shadow-lg shadow-brand/20">
              今月のロードマップを見る
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" className="h-12 px-8 rounded-full bg-white font-bold border-border/50">
              アーカイブ
            </Button>
          </div>
        </div>

        <div className="w-full max-w-[320px] aspect-square rounded-2xl bg-white shadow-xl shadow-notion-text/5 p-6 border border-border/30 rotate-2 hover:rotate-0 transition-transform duration-500">
            <div className="h-full w-full rounded-xl bg-notion-bg flex flex-col items-center justify-center p-6 text-center">
                <Sparkles className="h-12 w-12 text-brand mb-4 opacity-50" />
                <h4 className="font-bold text-sm mb-2">今月の目標</h4>
                <p className="text-sm text-muted-foreground">
                    {theme.goal || "日々の授業の中に、自分らしい「余白」を15分だけ見つける。"}
                </p>
            </div>
        </div>
      </div>
    </motion.div>
  );
}
