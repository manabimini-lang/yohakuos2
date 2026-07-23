"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Sparkles, Calendar, ArrowRight } from "lucide-react";

interface YuiFirstMeetingCardProps {
  onComplete: () => void;
}

export function YuiFirstMeetingCard({ onComplete }: YuiFirstMeetingCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConnectCalendar = () => {
    window.location.href = "/api/yui/google/connect";
  };

  const handleSkipOnboarding = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/yui/onboarding/complete", {
        method: "POST",
      });
      if (response.ok) {
        onComplete();
      } else {
        // Fallback
        onComplete();
      }
    } catch (e) {
      console.error("Failed to skip onboarding", e);
      onComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl py-8">
      <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-background to-muted/20 p-8 md:p-10 shadow-lg space-y-8">
        {/* YUI Profile Header */}
        <div className="flex items-center gap-4 border-b border-border/40 pb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground shadow-md">
            YUI
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              AI Secretary & Partner
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              こんにちは。私はYUIです。
            </h1>
          </div>
        </div>

        {/* Introduction Speech */}
        <div className="space-y-4 text-base leading-7 text-foreground/90 md:text-lg">
          <p className="leading-relaxed">
            私はあなたの記録や予定をもとに、<span className="font-semibold text-primary">今日どう動くかを整理する秘書</span>です。
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed md:text-base">
            情報を保存するだけではなく、以下の3つを一緒に考えます。
          </p>
          <div className="grid gap-3 pt-2 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-background/80 p-4 text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">01</span>
              <p className="text-sm font-semibold text-foreground">やるべきこと</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/80 p-4 text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">02</span>
              <p className="text-sm font-semibold text-foreground">優先事項</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/80 p-4 text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">03</span>
              <p className="text-sm font-semibold text-foreground">集中時間</p>
            </div>
          </div>
        </div>

        {/* Second Card: Proposal for Google Calendar */}
        <div className="rounded-3xl border border-primary/20 bg-background/90 p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              より正確な提案を行うために
            </h2>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            Google Calendarを連携すると、あなたの予定を把握し、空き時間や集中時間を自動で発見・提案できるようになります。
          </p>
          <ul className="space-y-2 text-xs font-medium text-foreground/80">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              本日の予定とタイムブロックの把握
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              集中時間の自動発見とスロット提案
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              朝礼（Morning Brief）の最適化
            </li>
          </ul>

          <div className="pt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleConnectCalendar}
              className="yohaku-btn w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 text-sm font-semibold shadow-md"
            >
              <Calendar className="h-4 w-4" />
              <span>Google Calendarを連携する</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void handleSkipOnboarding()}
              className="w-full sm:w-auto text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 py-2 px-4 transition text-center"
            >
              {isSubmitting ? "設定中..." : "あとで設定する"}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
