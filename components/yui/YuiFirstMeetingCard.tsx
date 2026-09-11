"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Sparkles, Calendar, ArrowRight } from "lucide-react";

interface YuiFirstMeetingCardProps {
  onComplete: () => void;
  onStartWithGoal: () => void;
}

export function YuiFirstMeetingCard({ onComplete, onStartWithGoal }: YuiFirstMeetingCardProps) {
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

  const handleStartWithGoal = async () => {
    setIsSubmitting(true);
    try {
      await fetch("/api/yui/onboarding/complete", { method: "POST" });
    } catch (e) {
      console.error("Failed to complete onboarding", e);
    } finally {
      onStartWithGoal();
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

        {/* First value: a goal can be saved without AI or Google setup. */}
        <div className="rounded-3xl border border-primary/20 bg-background/90 p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              最初は、今日の目的を一つだけ
            </h2>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            AI設定やGoogle連携はあとから追加できます。まず、今週進めたいことや今日気になっていることを一つ保存してみましょう。
          </p>

          <div className="pt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void handleStartWithGoal()}
              className="yohaku-btn w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 text-sm font-semibold shadow-md"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isSubmitting ? "準備中..." : "目的を一つ登録する"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConnectCalendar}
              className="w-full sm:w-auto text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 py-2 px-4 transition text-center"
            >
              Google Calendarを連携する（任意）
            </button>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void handleSkipOnboarding()}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            {isSubmitting ? "設定中..." : "あとで設定する"}
          </button>
        </div>
      </Card>
    </div>
  );
}
