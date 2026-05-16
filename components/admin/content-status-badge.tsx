import { PUBLISH_STATUS_LABELS, VISIBILITY_LABELS } from "@/lib/translations";
import { PublishStatus, ContentVisibility } from "@prisma/client";

type BadgeTone = "neutral" | "info" | "success" | "warning";

const toneClass: Record<BadgeTone, string> = {
  neutral: "bg-slate-100 text-slate-700",
  info: "bg-sky-100 text-sky-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
};

export function ContentStatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold tracking-wide ${toneClass[tone]}`}
    >
      {label}
    </span>
  );
}

export function publishStatusTone(status: PublishStatus): BadgeTone {
  if (status === "PUBLISHED") return "success";
  if (status === "SCHEDULED") return "info";
  if (status === "DRAFT") return "warning";
  return "neutral";
}

export function visibilityTone(visibility: ContentVisibility): BadgeTone {
  if (visibility === "PAID") return "success";
  if (visibility === "FREE") return "info";
  if (visibility === "ADMIN") return "warning";
  return "neutral";
}
