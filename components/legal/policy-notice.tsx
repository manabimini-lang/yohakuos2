import React from "react";
import { Info } from "lucide-react";

interface PolicyNoticeProps {
  text: string;
}

export function PolicyNotice({ text }: PolicyNoticeProps) {
  return (
    <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/40 dark:bg-slate-900/40">
      <Info className="h-5 w-5 shrink-0 text-slate-400 dark:text-slate-500 mt-0.5" />
      <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400 font-normal">
        {text}
      </p>
    </div>
  );
}
