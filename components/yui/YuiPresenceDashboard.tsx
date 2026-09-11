"use client";

import { CalendarCheck2, CircleDotDashed, Clock3, Sparkles, Target } from "lucide-react";
import { Card } from "@/components/ui/card";

export type YuiPresenceState = "idle" | "syncing" | "thinking" | "proposal_ready" | "focus_time" | "reflection_ready";

type Props = {
  displayName?: string | null;
  state: YuiPresenceState;
  focusTitle: string;
  nextAction: string;
  progress: number;
  hasGoal: boolean;
  hasNextStep: boolean;
  hasScheduledTime: boolean;
  hasReflection: boolean;
  onOpenChat: () => void;
};

const stateCopy: Record<YuiPresenceState, { label: string; message: string }> = {
  idle: { label: "待機中", message: "必要なときに、今日の流れを一緒に整えます。" },
  syncing: { label: "同期中", message: "予定と新しい情報を静かに確認しています。" },
  thinking: { label: "考え中", message: "今の目的に合う次の一歩を整理しています。" },
  proposal_ready: { label: "提案あり", message: "確認すると、今日の一歩を前に進められます。" },
  focus_time: { label: "集中時間", message: "確保した時間があります。始める準備ができています。" },
  reflection_ready: { label: "振り返り", message: "今日の流れを、短く振り返るのに良い頃です。" },
};

export function YuiPresenceDashboard({
  displayName,
  state,
  focusTitle,
  nextAction,
  progress,
  hasGoal,
  hasNextStep,
  hasScheduledTime,
  hasReflection,
  onOpenChat,
}: Props) {
  const copy = stateCopy[state];
  const isActive = state === "syncing" || state === "thinking";
  const stages = [
    { label: "目的を決める", complete: hasGoal, completeLabel: "決定済み" },
    { label: "次にすることを決める", complete: hasNextStep, completeLabel: "決定済み" },
    { label: "予定", complete: hasScheduledTime, completeLabel: "予定あり" },
    { label: "振り返り", complete: hasReflection, completeLabel: "記録済み" },
  ];

  return (
    <Card className="relative overflow-hidden rounded-3xl border-slate-200 bg-gradient-to-br from-white via-slate-50 to-sky-50/60 p-6 shadow-sm">
      <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full border border-sky-200/60 bg-sky-100/30" />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-sky-200 bg-white shadow-sm">
            <span className={`absolute inset-1 rounded-full border border-sky-200/80 ${isActive ? "animate-ping motion-reduce:animate-none" : ""}`} />
            <span className={`absolute inset-3 rounded-full bg-sky-100 ${state === "focus_time" ? "animate-pulse motion-reduce:animate-none" : ""}`} />
            <Sparkles className="relative h-6 w-6 text-sky-700" aria-hidden="true" />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-semibold tracking-[0.12em] text-slate-400">YUIの状況：{copy.label}</p>
            <h2 className="truncate text-xl font-semibold tracking-tight text-slate-900">
              {displayName ? `${displayName}さん、${focusTitle}` : focusTitle}
            </h2>
            <p className="text-sm leading-6 text-slate-600">{copy.message}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
          <p className="text-[10px] font-semibold tracking-[0.12em] text-slate-400">次にすること</p>
          <p className="mt-1 max-w-sm text-sm font-medium leading-6 text-slate-800">{nextAction}</p>
          <button type="button" onClick={onOpenChat} className="mt-2 text-xs font-semibold text-sky-700 hover:text-sky-900">
            YUIに相談する
          </button>
        </div>
      </div>

      <div className="relative mt-6 border-t border-slate-200/80 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Target className="h-3.5 w-3.5" aria-hidden="true" />
            <span>目的の進捗 {Math.round(Math.max(0, Math.min(100, progress)))}%</span>
          </div>
          {hasScheduledTime ? <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><CalendarCheck2 className="h-3.5 w-3.5" />予定確保済み</span> : null}
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {stages.map((stage, index) => (
            <div key={stage.label} className="min-w-0">
              <div className="flex items-center gap-1.5">
                {stage.complete ? <CircleDotDashed className="h-3.5 w-3.5 text-sky-700" /> : <Clock3 className="h-3.5 w-3.5 text-slate-300" />}
                <span className={`truncate text-[11px] ${stage.complete ? "font-medium text-slate-700" : "text-slate-400"}`}>{stage.label}</span>
              </div>
              <div className={`mt-2 h-1 rounded-full ${stage.complete ? "bg-sky-500" : "bg-slate-200"}`} aria-label={`${index + 1}. ${stage.label}: ${stage.complete ? stage.completeLabel : "これから"}`} />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
