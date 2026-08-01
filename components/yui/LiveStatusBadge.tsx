"use client";

export type LiveStatus = "loading" | "updating" | "cached" | "offline" | "error";

type Props = {
  status: LiveStatus;
  text?: string;
};

const STATUS_STYLES: Record<LiveStatus, string> = {
  loading: "border-sky-200 bg-sky-50 text-sky-700",
  updating: "border-amber-200 bg-amber-50 text-amber-700",
  cached: "border-emerald-200 bg-emerald-50 text-emerald-700",
  offline: "border-slate-300 bg-slate-100 text-slate-700",
  error: "border-rose-200 bg-rose-50 text-rose-700",
};

const STATUS_LABELS: Record<LiveStatus, string> = {
  loading: "Loading",
  updating: "Updating",
  cached: "Cached",
  offline: "Offline",
  error: "Error",
};

export function LiveStatusBadge({ status, text }: Props) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLES[status]}`}>
      {text ?? STATUS_LABELS[status]}
    </span>
  );
}
