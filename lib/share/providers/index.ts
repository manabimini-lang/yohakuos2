import type { ShareProvider } from "../types";
import { DiscordShareProvider } from "./discord";

const providers: Record<string, () => ShareProvider> = {
  discord: () => new DiscordShareProvider(),
  // 将来の拡張例:
  // slack: () => new SlackShareProvider(),
  // line: () => new LineShareProvider(),
  // note: () => new NoteShareProvider(),
};

export function getProvider(name: string): ShareProvider {
  const factory = providers[name];
  if (!factory) {
    throw new Error(`Share provider "${name}" is not registered`);
  }
  return factory();
}
