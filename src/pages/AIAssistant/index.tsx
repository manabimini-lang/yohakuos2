import * as React from "react";
import { useState, useEffect } from "react";
import { 
  Sparkles, 
  BrainCircuit, 
  History, 
  Settings2,
  RefreshCw,
  Wand2,
  Bell
} from "lucide-react";
import { AIRecommendation } from "@/types";
import { SuggestionCard } from "./SuggestionCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const MOCK_RECS: AIRecommendation[] = [
  {
    id: "ai-1",
    category: "Engagement",
    title: "「探究学習」の議論活性化",
    suggestion: "来週月曜日の18時に「探究の評価」についてのスレッドを立て、アンケート機能を利用してメンバーの意見を集約してください。",
    reason: "ログによると、夜間（20時以降）に探究関連の記事へのアクセスが集中しており、多くの先生が悩んでいる兆候があります。",
    impact_score: 85,
    status: "pending",
    created_at: new Date().toISOString()
  },
  {
     id: "ai-2",
     category: "Retention",
     title: "チャット未活用の方向けサポート",
     suggestion: "3日間ログインはあるが発言がないメンバー12名に、個別にメンションを送り、最近の悩みをヒアリングするワークを提案してください。",
     reason: "閲覧のみのメンバーは、入会後2週間以内に発言がない場合、約60%の確率で休眠化する傾向がデータから見て取れます。",
     impact_score: 78,
     status: "pending",
     created_at: new Date().toISOString()
  },
  {
     id: "ai-3",
     category: "Content",
     title: "note風コラムのシリーズ化",
     suggestion: "「教職×ライフハック」というテーマの新しいカテゴリを作成し、週に1回1000文字程度の短編コラムを連載してください。",
     reason: "ライフスタイル系のタグがついた外部リンクのクリック率が全カテゴリ中1位（24%）を記録しています。",
     impact_score: 93,
     status: "pending",
     created_at: new Date().toISOString()
  },
  {
     id: "ai-4",
     category: "KPI",
     title: "アクティブユーザー目標の再設定",
     suggestion: "現在のMAU 1,200名の目標を、リテンション率向上にフォーカスした「週次アクティブ 300名」に切り替え、平日朝のニュース配信を強化しましょう。",
     reason: "全体のユーザー数は伸びていますが、コア層のエンゲージメント時間が先月比で5分減少しています。",
     impact_score: 82,
     status: "pending",
     created_at: new Date().toISOString()
  }
];

export default function AIAssistant() {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Simulate initial fetch
    setRecommendations(MOCK_RECS);
  }, []);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast.success("最新のKPIを分析し、提案を更新しました。");
    }, 2000);
  };

  const handleApply = (id: string) => {
    setRecommendations(prev => prev.filter(r => r.id !== id));
    toast.success("提案を承認しました。タスクリストに追加されます。");
  };

  const handleDismiss = (id: string) => {
    setRecommendations(prev => prev.filter(r => r.id !== id));
    toast.info("提案を却下しました。");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-brand font-black uppercase tracking-[0.2em] text-xs">
            <BrainCircuit className="h-4 w-4" />
            YOHAKU AI Engine
          </div>
          <h1 className="text-3xl font-black tracking-tight">AI アシスタント</h1>
          <p className="text-muted-foreground text-sm max-w-lg">
            4つのAIエージェントがコミュニティの健全性を24時間モニタリングしています。
            あなたの「余白」を生むための提案を確認してください。
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleSync}
            disabled={isSyncing}
            className="rounded-full font-bold h-10 px-6 border-border/50 bg-white"
          >
            {isSyncing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin text-brand" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            KPIを再同期
          </Button>
          <Button className="rounded-full font-bold h-10 px-6 bg-brand hover:bg-brand/90 text-white shadow-lg shadow-brand/20">
            <Wand2 className="h-4 w-4 mr-2" />
            エージェント設定
          </Button>
        </div>
      </div>

      {/* Agents Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "KPI", status: "分析中", color: "text-blue-500" },
          { label: "Retention", status: "待機", color: "text-purple-500" },
          { label: "Engagement", status: "アラート", color: "text-brand" },
          { label: "Content", status: "良好", color: "text-orange-500" },
        ].map(agent => (
          <div key={agent.label} className="p-4 rounded-2xl bg-notion-bg/50 border border-border/20 flex flex-col items-center justify-center text-center">
            <span className={`text-[10px] font-black uppercase tracking-widest ${agent.color} mb-1`}>{agent.label}</span>
            <span className="text-xs font-bold text-muted-foreground">{agent.status}</span>
          </div>
        ))}
      </div>

      {/* Suggestions Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black flex items-center gap-2">
            <Bell className="h-5 w-5 text-brand" />
            現在の提案（{recommendations.length}件）
          </h2>
          <Button variant="ghost" className="text-xs font-bold text-muted-foreground">
            過去の履歴
            <History className="ml-2 h-3 w-3" />
          </Button>
        </div>

        <AnimatePresence mode="popLayout">
          {recommendations.length > 0 ? (
            <motion.div 
              className="grid gap-6 md:grid-cols-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {recommendations.map((rec) => (
                <motion.div
                  key={rec.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                >
                  <SuggestionCard 
                    recommendation={rec}
                    onApply={handleApply}
                    onDismiss={handleDismiss}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-24 flex flex-col items-center justify-center text-center space-y-4"
            >
              <div className="h-20 w-20 rounded-full bg-notion-bg flex items-center justify-center text-brand/20">
                <Sparkles className="h-10 w-10" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-black italic">No urgent suggestions.</p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  コミュニティは良好な状態です。新しいKPIデータが蓄積されるまでお待ちください。
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Tip */}
      <Card className="bg-brand/5 border-none shadow-none p-6">
        <div className="flex gap-4">
          <div className="h-10 w-10 rounded-full bg-brand flex items-center justify-center text-white shrink-0 shadow-lg shadow-brand/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="space-y-1">
             <h4 className="font-bold text-brand italic">AI 活用アドバイス</h4>
             <p className="text-sm text-muted-foreground leading-relaxed">
                AIエージェントの提案を承認しても、実際の実行（メール送信や投稿）はあなたが最後に行います。
                ツールに「任せきる」のではなく、あなたの言葉を添えてコミュニティの温度感を保ちましょう。
             </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
