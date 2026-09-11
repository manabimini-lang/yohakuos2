import type { AITaskClass } from "./gemini-model-routing";

export const STANDARD_GROQ_MODEL = "openai/gpt-oss-20b";
export const ECONOMY_GROQ_MODEL = "openai/gpt-oss-20b";

export function resolveGroqModelName(_requestedModel?: string | null, _taskClass: AITaskClass = "economy") {
  // Server-owned model selection prevents a stored or client supplied value
  // from routing traffic to an unapproved Groq model.
  return ECONOMY_GROQ_MODEL;
}
