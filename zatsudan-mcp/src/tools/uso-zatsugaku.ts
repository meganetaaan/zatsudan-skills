import { z } from "zod";
import type { Env } from "../env";
import { runTextGeneration } from "../llm/workers-ai";
import { buildUsoZatsugakuPrompt } from "../llm/prompts";
import { pickMany, textResult } from "./util";
import wordPool from "../data/word-pool.json";

export const usoZatsugakuInputSchema = {
  theme: z.string().max(100).optional().describe("雑学のテーマ（任意）"),
  count: z
    .number()
    .int()
    .min(1)
    .max(5)
    .optional()
    .describe("生成する項目数（1〜5、デフォルト3）"),
};

const schema = z.object(usoZatsugakuInputSchema);
export type UsoZatsugakuInput = z.infer<typeof schema>;

/** LLM 失敗時の deterministic fallback。 */
function fallback(theme: string | undefined, words: string[]): string {
  const w = words[0] ?? "冷蔵庫";
  const items = [
    `${w}の並びをそろえると、その日の運がほんの少しだけ整うと言われています。`,
    `${theme ?? "エスカレーター"}の手すりが少しだけ速いのは、人に「前に進んでいる感」を出す演出だそうです。`,
    `使わない引き出しほど、家の思い出をこっそり多めに保存しているらしいです。`,
  ];
  return ["雑学をどうぞ", "", ...items.map((t) => `* ${t}`)].join("\n");
}

export async function generateUsoZatsugaku(
  env: Env,
  input: UsoZatsugakuInput,
) {
  const count = input.count ?? 3;
  const theme = input.theme?.trim() || undefined;

  // theme があれば1語目として固定し、残りをプールから補う。
  const drawn = pickMany(wordPool as string[], theme ? count : count + 1);
  const words = theme ? [theme, ...drawn] : drawn;

  const prompt = buildUsoZatsugakuPrompt({ theme, count, words });

  try {
    const text = await runTextGeneration(env, prompt, { maxTokens: 448 });
    return textResult(text);
  } catch {
    return textResult(fallback(theme, words));
  }
}
