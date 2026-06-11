export function reportError(scope: string, error: unknown) {
  console.error(`[${scope}]`, error);
}
