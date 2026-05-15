import * as React from "react";
import { 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Users, 
  Zap, 
  FileText
} from "lucide-react";
import { AIRecommendation } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SuggestionCardProps {
  recommendation: AIRecommendation;
  onApply: (id: string) => void;
  onDismiss: (id: string) => void;
}

const categoryIcons = {
  KPI: TrendingUp,
  Retention: Users,
  Engagement: Zap,
  Content: FileText,
};

const categoryColors = {
  KPI: "text-blue-500 bg-blue-50 border-blue-100",
  Retention: "text-purple-500 bg-purple-50 border-purple-100",
  Engagement: "text-brand bg-brand/5 border-brand/10",
  Content: "text-orange-500 bg-orange-50 border-orange-100",
};

export function SuggestionCard({ recommendation, onApply, onDismiss }: SuggestionCardProps) {
  const Icon = categoryIcons[recommendation.category];
  const colors = categoryColors[recommendation.category];

  return (
    <Card className="border-none shadow-md overflow-hidden relative group">
      <div className={`absolute top-0 left-0 w-1.5 h-full ${colors.split(' ')[2].replace('border-', 'bg-')}`} />
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={`font-bold text-[10px] uppercase tracking-wider ${colors}`}>
            <Icon className="h-3 w-3 mr-1" />
            {recommendation.category} Agent
          </Badge>
          <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
            PROBABILITY <span className="text-brand">{recommendation.impact_score}%</span>
          </div>
        </div>
        <CardTitle className="text-lg font-black mt-2 leading-tight">
          {recommendation.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-xl bg-notion-bg/50 border border-border/10 text-sm leading-relaxed text-notion-text">
          {recommendation.suggestion}
        </div>
        
        <div className="space-y-1">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> 提案の根拠
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {recommendation.reason}
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button 
            onClick={() => onApply(recommendation.id)}
            className="flex-1 bg-brand hover:bg-brand/90 text-white font-bold h-10 rounded-lg text-xs"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            承認・実行
          </Button>
          <Button 
            variant="outline"
            onClick={() => onDismiss(recommendation.id)}
            className="flex-1 h-10 border-border/50 font-bold text-xs"
          >
            <XCircle className="h-4 w-4 mr-2" />
            却下
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
