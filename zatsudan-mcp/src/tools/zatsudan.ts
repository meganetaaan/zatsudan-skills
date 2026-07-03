import { z } from "zod";
import type { Env } from "../env";
import { runTextGeneration } from "../llm/workers-ai";
import { buildZatsudanPrompt } from "../llm/prompts";
import { pickMany, pickOne, textResult } from "./util";
import wordPool from "../data/word-pool.json";

const GENRES = [
  "uso_zatsugaku",
  "world_bug_report",
  "micro_conspiracy",
] as const;

export const zatsudanInputSchema = {
  topic: z.string().max(100).optional().describe("雑談の題材（任意）"),
  mood: z
    .enum(["funny", "absurd", "gentle"])
    .optional()
    .describe("トーン（デフォルト funny）"),
  genre: z
    .enum([
      "uso_zatsugaku",
      "world_bug_report",
      "micro_conspiracy",
      "auto",
    ])
    .optional()
    .describe("ジャンル（デフォルト auto）"),
};

const schema = z.object(zatsudanInputSchema);
export type ZatsudanInput = z.infer<typeof schema>;

/** LLM 失敗時の deterministic fallback。 */
function fallback(topic: string | undefined, seedWords: string[]): string {
  const w = topic ?? seedWords[0] ?? "エアコン";
  return `そういえば${w}って、見てない間だけちょっとサボってる気がするんですよね。まあ気のせいなんですけど。`;
}

export async function generateZatsudan(env: Env, input: ZatsudanInput) {
  const topic = input.topic?.trim() || undefined;
  const mood = input.mood ?? "funny";
  const requestedGenre = input.genre ?? "auto";

  // auto の場合は seed words の並びからジャンルを1つ選ぶ。
  const genre =
    requestedGenre === "auto"
      ? pickOne(GENRES) ?? "uso_zatsugaku"
      : requestedGenre;

  const seedWords = pickMany(wordPool as string[], 3);

  const prompt = buildZatsudanPrompt({ topic, mood, genre, seedWords });

  try {
    const text = await runTextGeneration(env, prompt, { maxTokens: 256 });
    return textResult(text);
  } catch {
    return textResult(fallback(topic, seedWords));
  }
}
