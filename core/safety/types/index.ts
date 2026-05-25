export type RiskLevel = "low" | "medium" | "high" | "critical";

export type SafetyState = "safe" | "monitoring" | "review_required" | "restricted" | "escalated";

export type UserSignalType = "usage_frequency" | "night_activity" | "session_duration" | "emotional_volatility";
export type AISignalType = "repeated_reassurance_requests" | "unsafe_prompt_patterns" | "dependency_indicators";
export type CommunitySignalType = "harassment" | "dm_abuse" | "manipulation_attempts";

export type SignalType = UserSignalType | AISignalType | CommunitySignalType;
export type SignalSource = "user" | "ai" | "community" | "system";

export interface SafetySignal {
  id: string;
  userId: string;
  type: SignalType;
  source: SignalSource;
  value: number | string | boolean;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface RiskAssessment {
  id: string;
  entityId: string; // userId or aiResponseId
  entityType: "user" | "ai_response";
  riskScore: number;
  riskLevel: RiskLevel;
  reasons: string[];
  signals: SafetySignal[];
  timestamp: Date;
}

export interface SafetyPolicy {
  id: string;
  name: string;
  description: string;
  criteria: Record<string, any>; // 例: { signalType: "unsafe_prompt_patterns", threshold: 0.8 }
  action: "monitor" | "review" | "restrict" | "escalate";
  isActive: boolean;
}

export type EscalationAction = "monitoring" | "review_queue" | "moderator_escalation" | "safety_restriction";

export interface Escalation {
  id: string;
  entityType: "user" | "ai_response";
  entityId: string;
  riskScore: RiskScore;
  currentSafetyState: SafetyState;
  escalatedTo: "moderator" | "admin";
  reason: string;
  escalatedBy: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  status: "pending" | "in_progress" | "resolved";
  createdAt: Date;
  updatedAt: Date;
}

export interface HumanReview {
  id: string;
  entityType: "user" | "ai_response";
  entityId: string;
  riskAssessmentId: string;
  riskScore: RiskScore;
  suggestedState: SafetyState;
  reviewerId?: string;
  decision?: "approved" | "rejected" | "escalated";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewItem {
  id: string;
  humanReviewId: string;
  entityType: "user" | "ai_response";
  entityId: string;
  riskScore: RiskScore;
  currentSafetyState: SafetyState;
  suggestedAction: EscalationAction;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface SafetyEventPayload {
  type: "risk_detected" | "state_transition" | "escalation" | "review_action";
  timestamp: Date;
  entityType: "user" | "ai_response";
  entityId: string;
  riskAssessment?: RiskAssessment;
  newState?: SafetyState;
  oldState?: SafetyState;
  escalation?: Escalation;
  review?: HumanReview;
  metadata?: Record<string, any>;
}

export interface SafetyHealth {
  overallRiskLevel: RiskLevel;
  activeIncidents: number;
  pendingReviews: number;
  escalatedCases: number;
  lastUpdated: Date;
}

export interface RiskScore {
  score: number;
  level: RiskLevel;
  reasons: string[];
  signals: SafetySignal[];
}

export type RiskSignal = SafetySignal;

