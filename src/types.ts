export type Role = 'admin' | 'staff' | 'member';
export type ContentLayer = 'public' | 'member' | 'exclusive';

export type AIRecommendation = {
  id: string;
  category: 'KPI' | 'Retention' | 'Engagement' | 'Content';
  title: string;
  suggestion: string;
  reason: string;
  impact_score: number;
  status: 'pending' | 'applied' | 'dismissed';
  created_at: string;
};

export type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: Role;
  created_at: string;
};

export type Content = {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  external_url?: string;
  category: string;
  layer: ContentLayer;
  monthly_theme_id?: string;
  is_published: boolean;
  author_id?: string;
  created_at: string;
  updated_at: string;
};

export type MonthlyTheme = {
  id: string;
  month_date: string;
  title: string;
  description: string;
  goal?: string;
};
