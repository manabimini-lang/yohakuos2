export const CARD_STYLE_VALUES = ["COMPACT", "DEFAULT", "COMFORTABLE"] as const;
export type CardStyleValue = (typeof CARD_STYLE_VALUES)[number];
