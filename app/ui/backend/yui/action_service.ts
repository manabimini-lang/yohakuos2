import { getPlanningSuggestions } from "./planning_service";

export interface YuiActionSuggestion {
  /** Unique identifier */
  id: string;
  /** Human readable title of the suggested action */
  title: string;
  /** Detailed description or reason for the suggestion */
  description: string;
  /** The thread (topic) that this action relates to */
  sourceThread: string;
  /** Type of action – generic for now */
  actionType: "goal" | "reflection" | "calendar" | "timeblock";
  /** Priority score, higher means more urgent */
  priorityScore: number;
  /** Optional target entity id (future expansion) */
  targetId?: string;
  /** The reasoning behind this suggestion */
  reason: string;
}

export interface YuiActionSummary {
  suggestions: YuiActionSuggestion[];
}

/**
 * Generate action suggestions by leveraging existing planning suggestions.
 * Currently maps each planning suggestion to an action suggestion.
 */
export async function getActionSuggestions(userId: string): Promise<YuiActionSummary> {
  // Retrieve planning suggestions
  const planning = await getPlanningSuggestions(userId);

  // Map planning suggestions to action suggestions
  const suggestions = planning.suggestions.map((p) => ({
    id: `${p.thread}-${Date.now()}`,
    title: p.suggestedAction,
    description: p.suggestedAction,
    sourceThread: p.thread,
    actionType: "goal" as const,
    priorityScore: p.priorityScore,
    reason: p.reason,
  }));

  return { suggestions };
}
