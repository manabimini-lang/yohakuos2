import React from "react";
import { Calendar } from "lucide-react";

interface LastUpdatedProps {
  date: string;
}

export function LastUpdated({ date }: LastUpdatedProps) {
  return (
    <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground dark:text-muted-foreground font-medium">
      <Calendar className="h-3.5 w-3.5" />
      <span>最終更新日: {date}</span>
    </div>
  );
}
