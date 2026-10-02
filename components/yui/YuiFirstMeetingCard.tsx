"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ArrowRight, PenLine } from "lucide-react";

interface YuiFirstMeetingCardProps {
  onComplete: () => void;
  onStartWithGoal: () => void;
  onStartWithMemo: () => void;
}

export function YuiFirstMeetingCard({ onComplete, onStartWithGoal, onStartWithMemo }: YuiFirstMeetingCardProps) {
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

  const handleStartWithMemo = async () => {
    setIsSubmitting(true);
    try {
      await fetch("/api/yui/onboarding/complete", { method: "POST" });
    } catch (e) {
      console.error("Failed to complete onboarding", e);
    } finally {
      onStartWithMemo();
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl py-2 sm:py-6">
      <Card className="relative border-primary/30 bg-gradient-to-br from-primary/10 via-background to-muted/20 p-5 shadow-lg sm:p-7">
        {/* YUI Profile Header */}
        <div className="flex items-center gap-3 border-b border-border/40 pb-4">
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
        <div className="mt-4 text-sm leading-6 text-foreground/90">
          <p>気になることを一文で残し、あとから見返せます。今日やることを決めたいときも、ここから始められます。</p>
        </div>

        <div className="mt-5 rounded-3xl border border-primary/20 bg-background/90 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-primary">
            <PenLine className="h-5 w-5" />
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              まずは一文だけ
            </h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            たとえば「明日の朝、机を10分だけ片付けたい」。AI設定やGoogle連携は不要です。
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void handleStartWithMemo()}
              className="yohaku-btn inline-flex min-h-12 w-full items-center justify-center gap-2 px-4 py-3 text-sm font-semibold shadow-md"
            >
              <PenLine className="h-4 w-4" />
              <span>{isSubmitting ? "準備中..." : "一文だけメモする"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void handleStartWithGoal()}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground hover:bg-muted"
            >
              目的を一つ登録する
            </button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <button type="button" disabled={isSubmitting} onClick={() => void handleSkipOnboarding()} className="min-h-11 font-medium text-foreground underline underline-offset-4">
            {isSubmitting ? "設定中..." : "あとで設定する"}
          </button>
          <button type="button" disabled={isSubmitting} onClick={handleConnectCalendar} className="min-h-11 text-muted-foreground underline underline-offset-4 hover:text-foreground">
            Google Calendarを連携する（任意）
          </button>
        </div>
      </Card>
    </div>
  );
}
