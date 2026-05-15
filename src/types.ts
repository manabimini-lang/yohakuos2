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
  full_name?: string;
  avatar_url?: string;
  role: Role;
};
