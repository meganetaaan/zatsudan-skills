/** tools 共通のユーティリティ。 */

/** 配列から1件をランダムに選ぶ。空配列なら undefined。 */
export function pickOne<T>(items: readonly T[]): T | undefined {
  if (items.length === 0) return undefined;
  const index = Math.floor(Math.random() * items.length);
  return items[index];
}

/** 配列から重複なしで n 件をランダムに選ぶ（n が要素数を超えたら全件）。 */
export function pickMany<T>(items: readonly T[], n: number): T[] {
  const pool = [...items];
  const result: T[] = [];
  const take = Math.min(n, pool.length);
  for (let i = 0; i < take; i++) {
    const index = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(index, 1)[0]);
  }
  return result;
}

/** MCP tool の標準的な text content 応答を組み立てる。 */
export function textResult(text: string) {
  return {
    content: [
      {
        type: "text" as const,
        text,
      },
    ],
  };
}
