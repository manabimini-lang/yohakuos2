import {
  ContentLayer,
  ContentType,
  ContentVisibility,
  PublishStatus,
} from "@prisma/client";

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  ARTICLE: "記事",
  VIDEO: "動画",
  TASK: "課題",
  UPDATE: "お知らせ",
};

export const VISIBILITY_LABELS: Record<ContentVisibility, string> = {
  PUBLIC: "全体公開",
  FREE: "無料会員",
  PAID: "プレミアム会員",
  ADMIN: "管理者のみ",
};

export const PUBLISH_STATUS_LABELS: Record<PublishStatus, string> = {
  DRAFT: "下書き",
  SCHEDULED: "予約投稿",
  PUBLISHED: "公開中",
};

export const LAYER_LABELS: Record<ContentLayer, string> = {
  BEGINNER: "初級",
  INTERMEDIATE: "中級",
  ADVANCED: "上級",
};
