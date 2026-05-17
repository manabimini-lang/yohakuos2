import { z } from "zod";

export const generateAiResponseSchema = z.object({
  input: z.string()
    .min(1, "メッセージを入力してください。")
    .max(1000, "メッセージは1000文字以内で入力してください。"),
});

export type GenerateAiResponseInput = z.infer<typeof generateAiResponseSchema>;
