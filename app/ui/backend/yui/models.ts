export type YuiPreferences = Record<string, unknown>;
export type YuiNotificationSettings = Record<string, unknown>;

export type YuiProfile = {
  id: string;
  user_id: string;
  display_name: string | null;
  assistant_name: string | null;
  tone: string | null;
  life_theme: string | null;
  focus_area: string | null;
  has_completed_onboarding: boolean;
  preferences: YuiPreferences;
  notification_settings: YuiNotificationSettings;
  created_at: string;
  updated_at: string;
};

export type YuiProfileSettings = {
  display_name: string;
  assistant_name: string;
  tone: string;
  life_theme: string;
  focus_area: string;
  has_completed_onboarding?: boolean;
  notification_strength: string;
  summary_frequency: string;
  timezone: string;
};

export type YuiMemory = {
  id: string;
  user_id: string;
  title: string;
  summary: string;
  body: string;
  importance: number;
  tags: string[];
  source_type: string;
  created_at: string;
};

export type YuiMemorySource = "manual" | "yui_proposed" | string;

export type YuiConversation = {
  id: string;
  user_id: string;
  role: string;
  content: string;
  created_at: string;
};

export type YuiMemoryCandidateStatus = "pending" | "approved" | "rejected";

export type YuiMemoryCandidate = {
  id: string;
  user_id: string;
  conversation_id: string;
  title: string;
  summary: string;
  reason: string;
  importance: number;
  status: YuiMemoryCandidateStatus;
  created_at: string;
};

export type YuiMemoryCandidateDraft = {
  title: string;
  summary: string;
  reason: string;
  importance: number;
};

export type YuiReflection = {
  id: string;
  user_id: string;
  summary: string;
  insights: string[];
  next_actions: string[];
  created_at: string;
};

export type YuiEvent = {
  id: string;
  user_id: string;
  event_type: string;
  source: string;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  occurred_at: string;
  created_at: string;
};

export type YuiEventInput = {
  event_type: string;
  source: string;
  title: string;
  content?: string;
  metadata?: Record<string, unknown>;
  occurred_at?: string;
};

export type YuiConnectionStatus = "pending" | "connected" | "disconnected" | string;

export type YuiConnection = {
  id: string;
  user_id: string;
  provider: string;
  status: YuiConnectionStatus;
  permissions: Record<string, unknown>;
  metadata: Record<string, unknown>;
  connected_at: string | null;
  created_at: string;
  updated_at: string;
};

export type YuiConnectionInput = {
  provider: string;
  status?: string;
  permissions?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  connected_at?: string | null;
};

export type YuiConnectionStatusInput = {
  status: string;
};

export type YuiCalendarEventStatus = "confirmed" | "tentative" | "cancelled" | string;

export type YuiCalendarEvent = {
  id: string;
  user_id: string;
  connection_id: string;
  source: string;
  provider: string;
  external_id: string;
  title: string;
  description: string;
  start_at: string;
  end_at: string;
  location: string | null;
  status: YuiCalendarEventStatus;
  event_category?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type YuiCalendarEventInput = {
  connection_id: string;
  provider: string;
  external_id: string;
  title: string;
  source?: string;
  description?: string;
  start_at: string;
  end_at: string;
  location?: string | null;
  status?: string;
  event_category?: string | null;
  metadata?: Record<string, unknown>;
};

export type YuiSuggestedTimeBlockStatus = "pending" | "approved" | "rejected" | "created" | string;

export type YuiSuggestedTimeBlockSource = "yui_analysis" | "calendar_gap" | "goal_priority" | "manual" | string;

export type YuiSuggestedTimeBlock = {
  id: string;
  user_id: string;
  goal_id: string | null;
  title: string;
  reason: string;
  start_at: string;
  end_at: string;
  source: YuiSuggestedTimeBlockSource;
  status: YuiSuggestedTimeBlockStatus;
  created_at: string;
  updated_at: string;
};

export type YuiSuggestedTimeBlockInput = {
  goal_id?: string | null;
  title: string;
  reason: string;
  start_at: string;
  end_at: string;
  source?: string;
  status?: string;
};

export type YuiSuggestedTimeBlockStatusInput = {
  status: string;
};

export type YuiCalendarActionStatus = "pending" | "approved" | "scheduled" | "rejected" | string;

export type YuiCalendarActionProvider = "google_calendar" | "apple_calendar" | "manual" | string;

export type YuiCalendarAction = {
  id: string;
  user_id: string;
  time_block_id: string;
  provider: YuiCalendarActionProvider;
  title: string;
  start_at: string;
  end_at: string;
  status: YuiCalendarActionStatus;
  external_event_id: string | null;
  scheduled_at: string | null;
  reason: string | null;
  created_at: string;
  updated_at: string;
};

export type YuiCalendarActionInput = {
  time_block_id: string;
  provider?: string;
  title?: string;
  start_at?: string;
  end_at?: string;
  status?: string;
  reason?: string;
};

export type YuiCalendarActionStatusInput = {
  status: string;
};

export type YuiRecommendationType = "time_block" | "decision" | "task" | "reflection" | string;

export type YuiRecommendationStatus = "pending" | "accepted" | "rejected" | "completed" | string;

export type YuiRecommendation = {
  id: string;
  user_id: string;
  type: YuiRecommendationType;
  title: string;
  content: string;
  reason: string;
  score: number;
  related_goal_id: string | null;
  related_decision_ids: string[];
  related_memory_ids: string[];
  status: YuiRecommendationStatus;
  created_at: string;
};

export type YuiRecommendationInput = {
  type?: string;
  title?: string;
  content?: string;
  reason?: string;
  score?: number;
  related_goal_id?: string | null;
  related_decision_ids?: string[];
  related_memory_ids?: string[];
  status?: string;
};

export type YuiRecommendationStatusInput = {
  status: string;
};

export type YuiGoalStatus = "active" | "paused" | "completed" | string;

export type YuiGoal = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: YuiGoalStatus;
  progress: number;
  created_at: string;
  updated_at: string;
};

export type YuiMilestoneStatus = "pending" | "completed" | string;

export type YuiMilestone = {
  id: string;
  user_id: string;
  goal_id: string;
  title: string;
  status: YuiMilestoneStatus;
  created_at: string;
};

export type YuiDecision = {
  id: string;
  user_id: string;
  question: string;
  context: string;
  decision: string;
  rationale: string;
  confidence: number;
  created_at: string;
};

export type YuiDecisionInput = {
  question: string;
  context: string;
  decision: string;
  rationale: string;
  confidence?: number;
};

export type YuiDecisionChoice = {
  label: string;
  rationale: string;
};

export type YuiDecisionCard = {
  id: string;
  question: string;
  background: string;
  choices: YuiDecisionChoice[];
  reason: string;
  confidence: number;
};

export type YuiDailyBrief = {
  summary: string;
  yesterdayChanges: string[];
  importantMemories: string[];
  pendingItems: string[];
  recommendedActions: string[];
};

export type YuiCurrentPosition = {
  purpose: string;
  current: string;
  nextStep: string;
  progress: number;
};

export type YuiToday = {
  summary: string;
  importantMemories: YuiMemory[];
  pendingTasks: string[];
  recentInsights: string[];
  recentTrends: string[];
  nextThoughts: string[];
  recommendedActions: string[];
  decisionCards: YuiDecisionCard[];
  dailyBrief: YuiDailyBrief;
  currentPosition: YuiCurrentPosition;
  recentEvents: YuiEvent[];
  calendarEvents: YuiCalendarEvent[];
  suggestedTimeBlocks: YuiSuggestedTimeBlock[];
};

export type CreateYuiMemoryInput = {
  title: string;
  summary: string;
  body: string;
  importance?: number;
  tags?: string[];
  source_type?: string;
};

export type CreateYuiConversationInput = {
  role: string;
  content: string;
};

export type CreateYuiReflectionInput = {
  summary: string;
  insights?: string[];
  next_actions?: string[];
};

export type CreateYuiEventInput = YuiEventInput;

export type CreateYuiGoalInput = {
  title: string;
  description: string;
  status?: string;
  progress?: number;
};

export type UpdateYuiGoalInput = Partial<CreateYuiGoalInput>;

export type CreateYuiMilestoneInput = {
  goal_id: string;
  title: string;
  status?: string;
};

export type UpdateYuiMilestoneInput = Partial<Pick<CreateYuiMilestoneInput, "title" | "status">>;

export type CreateYuiCalendarEventInput = YuiCalendarEventInput;

export type CreateYuiSuggestedTimeBlockInput = YuiSuggestedTimeBlockInput;

export type CreateYuiCalendarActionInput = YuiCalendarActionInput;

export type CreateYuiRecommendationInput = YuiRecommendationInput;

export interface YuiNotificationPreferences {
  id: string;
  userId: string;
  enabled: boolean;
  morningEnabled: boolean;
  morningTime: string;
  eveningEnabled: boolean;
  eveningTime: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export type YuiNotificationPreview = {
  type: "morning" | "evening";
  title: string;
  message: string;
  generatedAt: string;
};

export type YuiContinuitySummary = {
  yesterdaySummary: string;
  todayFocus: string;
  continuityMessage: string;
};

export type YuiNotificationLog = {
  id: string;
  user_id: string;
  type: "morning" | "evening";
  title: string;
  body: string;
  delivered_at: string;
  provider: string;
  status: string;
};

export type YuiNotificationDeliveryStatus = {
  enabled: boolean;
  morningTime: string;
  eveningTime: string;
  timezone: string;
  lastDeliveredAt: string | null;
  lastDeliveredType: "morning" | "evening" | null;
  nextDeliveryTime: string | null;
  isTodayMorningDelivered: boolean;
  isTodayEveningDelivered: boolean;
};

export type YuiMemoryProfile = {
  id: string;
  user_id: string;
  memory_key: string;
  memory_value: string;
  confidence: number;
  last_observed_at: string;
  updated_at: string;
};



