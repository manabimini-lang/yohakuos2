const CATEGORY_LABELS: Record<string, string> = {
  meeting: "ミーティング",
  focus: "集中作業",
  learning: "学習",
  family: "家族",
  health: "健康",
  other: "その他",
};

export function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}
