import type { Env } from "../env";

/**
 * 使用する Workers AI モデル。雑談の日本語品質を優先し、Llama 3.3 70B（fp8-fast 量子化）を既定にする。
 * 旧既定の `@cf/meta/llama-3.1-8b-instruct` は Deprecated のため乗り換え済み。
 * 8B より Neuron 消費は大きい点に注意（無料枠を超えやすい）。
 * 別モデルへ差し替える場合はここだけ変更すればよい。
 */
export const TEXT_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast" as const;

/** 雑談用途なので短文生成に寄せる。トークン消費を抑えるため上限は低め。 */
export const DEFAULT_MAX_TOKENS = 384;
export const MAX_ALLOWED_TOKENS = 512;

export interface TextGenerationOptions {
  maxTokens?: number;
}

/**
 * Workers AI を呼び出す薄い wrapper。
 *
 * - `env.AI.run(...)` を利用する
 * - API 返却形式の揺れ（`response` / `result` / 配列 / 文字列）を吸収して `string` を返す
 * - 呼び出し側で fallback を扱えるよう、失敗時は例外を投げる
 */
export async function runTextGeneration(
  env: Env,
  prompt: string,
  options?: TextGenerationOptions,
): Promise<string> {
  const maxTokens = clampTokens(options?.maxTokens ?? DEFAULT_MAX_TOKENS);

  // instruct/chat モデルには `prompt`（補完）ではなく `messages`（チャット）で渡す。
  // 補完形式だと賢いモデルほど指示文ごと継続・エコーしてしまうため、
  // 指示・材料は system ロールに置き、user ロールは生成トリガのみにする。
  const raw = (await env.AI.run(TEXT_MODEL, {
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: "上記の指示に従い、本文だけを出力してください。" },
    ],
    max_tokens: maxTokens,
    // 雑談なので多少のばらつきは残しつつ、70B での外国語トークン混入を抑えるため控えめに。
    temperature: 0.6,
  })) as unknown;

  const text = extractText(raw);
  if (!text) {
    throw new Error("Workers AI から空の応答が返りました");
  }
  return text;
}

function clampTokens(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return DEFAULT_MAX_TOKENS;
  }
  return Math.min(Math.floor(value), MAX_ALLOWED_TOKENS);
}

/**
 * Workers AI テキスト生成の返却形式は models / runtime バージョンで揺れるため、
 * 代表的な形をすべて吸収して plain string に正規化する。
 */
function extractText(raw: unknown): string {
  if (raw == null) return "";
  if (typeof raw === "string") return raw.trim();

  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;

    // 最も一般的: { response: "..." }
    if (typeof obj.response === "string") return obj.response.trim();

    // { result: { response: "..." } } / { result: "..." }
    if (obj.result != null) {
      const nested = extractText(obj.result);
      if (nested) return nested;
    }

    // OpenAI 互換: { choices: [{ text | message.content }] }
    if (Array.isArray(obj.choices) && obj.choices.length > 0) {
      const first = obj.choices[0] as Record<string, unknown>;
      if (typeof first.text === "string") return first.text.trim();
      const message = first.message as Record<string, unknown> | undefined;
      if (message && typeof message.content === "string") {
        return message.content.trim();
      }
    }

    // { output_text: "..." } や { generated_text: "..." }
    if (typeof obj.output_text === "string") return obj.output_text.trim();
    if (typeof obj.generated_text === "string") {
      return obj.generated_text.trim();
    }
  }

  return "";
}
