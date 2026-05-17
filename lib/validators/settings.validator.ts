import { z } from "zod";

export const updateAiKeySchema = z.object({
  apiKey: z.string().min(1, "APIキーを入力してください。"),
});

export type UpdateAiKeyInput = z.infer<typeof updateAiKeySchema>;
