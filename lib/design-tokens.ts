export const designTokens = {
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
  },
  spacing: {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    6: 24,
    8: 32,
    12: 48,
    16: 64,
  },
} as const;

export type RadiusToken = keyof typeof designTokens.radius;
export type SpacingToken = keyof typeof designTokens.spacing;
