export const STANDARD_GEMINI_MODEL = "gemini-2.5-flash";
export const ECONOMY_GEMINI_MODEL = "gemini-2.5-flash-lite";

export type AITaskClass = "economy" | "standard";

export function resolveGeminiModelName(
  _requestedModel?: string | null,
  taskClass: AITaskClass = "economy",
): string {
  // The server owns this mapping. A stored or client-supplied model name must
  // never move traffic to an unapproved or unexpectedly expensive model.
  return taskClass === "standard" ? STANDARD_GEMINI_MODEL : ECONOMY_GEMINI_MODEL;
}
