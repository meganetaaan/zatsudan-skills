import { z } from "zod";
import type { Env } from "../env";
import { runTextGeneration } from "../llm/workers-ai";
import { buildMicroConspiracyPrompt } from "../llm/prompts";
import { pickOne, textResult } from "./util";
import conspiracyTopics from "../data/conspiracy-topics.json";

export const microConspiracyInputSchema = {
  topic: z.string().max(100).optional().describe("陰謀論の題材（任意）"),
};

const schema = z.object(microConspiracyInputSchema);
export type MicroConspiracyInput = z.infer<typeof schema>;

/** LLM 失敗時の deterministic fallback。 */
function fallback(topic: string | undefined, seedTopic: string): string {
  const subject = topic ?? seedTopic;
  return [
    "これは小さな陰謀かもしれません。",
    `${subject}のは、家の中のものたちが「まだ人間に支配されきっていない」と示すための、静かなデモ活動だと言われています。`,
  ].join("\n");
}

export async function generateMicroConspiracy(
  env: Env,
  input: MicroConspiracyInput,
) {
  const topic = input.topic?.trim() || undefined;
  const seedTopic =
    pickOne(conspiracyTopics as string[]) ?? "充電ケーブルが必要なときだけ見つからない";

  const prompt = buildMicroConspiracyPrompt({ topic, seedTopic });

  try {
    const text = await runTextGeneration(env, prompt, { maxTokens: 320 });
    return textResult(text);
  } catch {
    return textResult(fallback(topic, seedTopic));
  }
}
