import { z } from "zod";
import type { Env } from "../env";
import { runTextGeneration } from "../llm/workers-ai";
import { buildWorldBugReportPrompt } from "../llm/prompts";
import { pickOne, textResult } from "./util";
import worldTopics from "../data/world-topics.json";

export const worldBugReportInputSchema = {
  topic: z.string().max(100).optional().describe("バグ報告の題材（任意）"),
};

const schema = z.object(worldBugReportInputSchema);
export type WorldBugReportInput = z.infer<typeof schema>;

/** LLM 失敗時の deterministic fallback。 */
function fallback(topic: string | undefined, seedTopic: string): string {
  const subject = topic ?? seedTopic;
  return [
    "バグ報告です。",
    "",
    `タイトル: ${subject}`,
    "再現手順:",
    "1. いつも通りに過ごす",
    `2. ${subject}という状況になる`,
    "3. なぜか毎回そうなる",
    "期待結果: 想定どおりに物事が進む",
    "実際の結果: なぜか少しだけ理不尽になる",
  ].join("\n");
}

export async function generateWorldBugReport(
  env: Env,
  input: WorldBugReportInput,
) {
  const topic = input.topic?.trim() || undefined;
  const seedTopic = pickOne(worldTopics as string[]) ?? "靴下が片方だけ消える";

  const prompt = buildWorldBugReportPrompt({ topic, seedTopic });

  try {
    const text = await runTextGeneration(env, prompt, { maxTokens: 384 });
    return textResult(text);
  } catch {
    return textResult(fallback(topic, seedTopic));
  }
}
