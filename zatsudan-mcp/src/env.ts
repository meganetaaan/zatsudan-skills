/**
 * Cloudflare Workers の環境バインディング定義。
 *
 * - `AI`: Workers AI binding（wrangler.jsonc の `ai.binding` に対応）
 * - `ZATSUDAN_API_KEY`: Bearer token 認証用のキー。
 *   空文字または未設定の場合はローカル開発として認証なしで動作する。
 */
export interface Env {
  AI: Ai;
  ZATSUDAN_API_KEY?: string;
}
