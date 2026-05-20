"use client";

const MOODS = [
  { value: -2, emoji: "😫" },
  { value: -1, emoji: "🙁" },
  { value: 0, emoji: "😐" },
  { value: 1, emoji: "🙂" },
  { value: 2, emoji: "😁" },
];

type MoodSelectorProps = {
  value: number;
  onChange: (value: number) => void;
};

export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      {MOODS.map((mood) => (
        <button
          key={mood.value}
          type="button"
          onClick={() => onChange(mood.value)}
          className={`flex h-10 w-10 items-center justify-center rounded-full text-xl transition-all ${
            value === mood.value
              ? "bg-slate-100 ring-2 ring-slate-300 scale-110"
              : "bg-transparent opacity-60 hover:bg-slate-50 hover:opacity-100 hover:scale-105"
          }`}
          aria-label={`Mood ${mood.value}`}
        >
          {mood.emoji}
        </button>
      ))}
    </div>
  );
}
