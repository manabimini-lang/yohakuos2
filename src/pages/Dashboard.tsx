import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Users, FileText, TrendingUp, MessageSquare, Sparkles } from "lucide-react";
import { motion } from "motion/react";

const stats = [
  {
    title: "累計メンバー",
    value: "1,248",
    change: "+12%",
    icon: Users,
    color: "text-blue-600",
  },
  {
    title: "今月のコンテンツ",
    value: "24",
    change: "+4",
    icon: FileText,
    color: "text-brand",
  },
  {
    title: "エンゲージメント率",
    value: "68%",
    change: "+2.4%",
    icon: TrendingUp,
    color: "text-orange-600",
  },
  {
    title: "アクティブスレッド",
    value: "156",
    change: "+18",
    icon: MessageSquare,
    color: "text-purple-600",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Dashboard() {
  return (
    <div className="space-y-10">
      <section>
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-2">おはようございます、先生</h1>
          <p className="text-muted-foreground">プロジェクト「YOHAKU」の現在のステータスを確認しましょう。</p>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          {stats.map((stat) => (
            <motion.div key={stat.title} variants={item}>
              <Card className="border-none shadow-sm bg-notion-bg/50 hover:bg-notion-bg transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="text-brand font-medium">{stat.change}</span> 前月比
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">最近の投稿（note風）</h2>
            <button className="text-sm text-brand font-medium hover:underline">すべて見る</button>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-none shadow-sm hover:ring-1 hover:ring-brand/20 transition-all cursor-pointer">
                <CardContent className="p-4 flex gap-4">
                  <div className="h-20 w-28 rounded-md bg-notion-bg flex-shrink-0" />
                  <div className="flex flex-col justify-between py-1">
                    <h3 className="font-bold leading-tight">教育コミュニティにおける「余白」の重要性について</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>2024.05.12</span>
                      <span>•</span>
                      <span>5 min read</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">AI インサイト</h2>
          </div>
          <Card className="border-none shadow-sm bg-gradient-to-br from-brand/5 to-purple-500/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-brand" />
                今週のコミュニティ提案
              </CardTitle>
              <CardDescription>Geminiが分析したメンバーの関心事</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-white border border-brand/10 text-sm">
                <p className="font-medium text-brand mb-1">💡 注目トピック</p>
                <p className="text-muted-foreground">「探究学習の評価方法」に関する議論が活発になっています。ワークショップの開催を検討してみては？</p>
              </div>
              <div className="p-3 rounded-lg bg-white border border-brand/10 text-sm">
                <p className="font-medium text-brand mb-1">👥 新規メンバーの傾向</p>
                <p className="text-muted-foreground">20代の若手教員が15%増加しています。メンター制度の案内を強化すると定着率が上がる可能性があります。</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
