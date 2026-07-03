# zatsudan-mcp

雑談ネタを生成する **Remote MCP Server** です。
[`zatsudan-skills`](https://github.com/meganetaaan/zatsudan-skills) の雑談生成スキル（嘘雑学・世界のバグ報告・小さな陰謀論）の発想を、
Cloudflare Workers 上の MCP tool として再実装しています。

- 実行環境: **Cloudflare Workers**
- Web フレームワーク: **Hono**
- Transport: **MCP Streamable HTTP**（`/mcp`）
- LLM: **Cloudflare Workers AI**（`@cf/meta/llama-3.1-8b-instruct`、無料枠想定）
- 状態: stateless（Durable Objects / D1 / KV は未使用）

> ⚠️ 出力はすべて **ジョーク・雑談用途** です。もっともらしく見えても架空の内容なので、
> 事実情報・助言としては使わないでください。

## 提供する MCP tools

| tool | 概要 | 主な入力 |
| --- | --- | --- |
| `generate_uso_zatsugaku` | もっともらしいが架空の嘘雑学を生成 | `theme?`, `count?`(1〜5, 既定3) |
| `generate_world_bug_report` | 日常現象を「世界のバグ報告」風に生成 | `topic?` |
| `generate_micro_conspiracy` | 日常の小さな現象のくだらない陰謀論を生成 | `topic?` |
| `generate_zatsudan` | 上記3ジャンルを内部選択して短い雑談を生成 | `topic?`, `mood?`, `genre?` |

いずれも出力は次の形式です。

```json
{ "content": [{ "type": "text", "text": "..." }] }
```

## ローカル開発

```bash
npm install
npm run dev        # wrangler dev（既定 http://localhost:8787）
```

動作確認:

```bash
# ヘルスチェック
curl http://localhost:8787/
# => zatsudan-mcp is running
```

MCP クライアントからの叩き方は [`examples/requests.md`](./examples/requests.md) を参照してください。

型チェックとテスト:

```bash
npm run typecheck
npm test
```

ローカルでは `ZATSUDAN_API_KEY` が空のため **認証なし** で動作します。
認証込みで試す場合は `.dev.vars` に設定します。

```
# .dev.vars
ZATSUDAN_API_KEY=local-dev-key
```

## デプロイ

手動デプロイ:

```bash
npm run deploy     # wrangler deploy
```

Workers AI binding は `wrangler.jsonc` の `ai.binding` で有効化済みです。

### CI/CD（GitHub Actions）

`.github/workflows/zatsudan-mcp.yml` で自動化しています。

- **check**（push / PR）: `npm ci` → `npm run typecheck` → `npm test`
- **deploy**（`main` への push のみ）: check 成功後に `wrangler deploy`

`zatsudan-mcp/**` に変更があったときだけ起動します。

デプロイには以下の **リポジトリ Secrets** を設定してください
（Settings → Secrets and variables → Actions）。

| Secret | 必須 | 用途 |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | ✅ | Workers デプロイ用 API トークン（`Edit Cloudflare Workers` 権限） |
| `CLOUDFLARE_ACCOUNT_ID` | 任意 | 複数アカウント所属時に指定 |
| `ZATSUDAN_API_KEY` | 任意 | Worker 側の Bearer token。デプロイ時に `wrangler secret` へ同期される。未設定なら認証なしでデプロイ |

## API key の設定

`ZATSUDAN_API_KEY` が設定されている場合のみ、`/mcp` は Bearer token 認証を要求します。

```
Authorization: Bearer <ZATSUDAN_API_KEY>
```

- 空 or 未設定 … 認証なし（ローカル開発向け）
- 設定あり … 一致しない/無い場合は `401 Unauthorized`

本番用のキーは **wrangler secret** で設定してください（`wrangler.jsonc` の `vars` は空のまま）。

```bash
wrangler secret put ZATSUDAN_API_KEY
```

## MCP クライアントからの接続

デプロイ後の URL 例:

```
https://zatsudan-mcp.<your-subdomain>.workers.dev/mcp
```

### Claude Desktop / Claude Cloud など

Remote MCP（Streamable HTTP）対応クライアントに、上記 URL と Bearer token を登録します。

```json
{
  "mcpServers": {
    "zatsudan": {
      "url": "https://zatsudan-mcp.<your-subdomain>.workers.dev/mcp",
      "headers": {
        "Authorization": "Bearer <ZATSUDAN_API_KEY>"
      }
    }
  }
}
```

### mcp-remote 経由（stdio クライアント向け）

Streamable HTTP に直接対応しないクライアントでは `mcp-remote` を挟みます。

```json
{
  "mcpServers": {
    "zatsudan": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://zatsudan-mcp.<your-subdomain>.workers.dev/mcp",
        "--header",
        "Authorization: Bearer <ZATSUDAN_API_KEY>"
      ]
    }
  }
}
```

## 無料枠運用の注意

- Workers AI・Workers ともに **無料枠** での運用を想定しています。
- `max_tokens` は 512 以下（tool ごとに 256〜448）に抑え、短文生成に寄せています。
- 呼び出しが集中すると無料枠のレート制限に達することがあります。
- Workers AI 呼び出しに失敗した場合は、各 tool が短い **deterministic fallback** テキストを返します。

## 構成

```
zatsudan-mcp/
  src/
    index.ts              # Hono app + MCP endpoint + 認証
    env.ts                # Env（AI binding / API key）
    llm/
      workers-ai.ts       # Workers AI wrapper（返却形式の揺れを吸収）
      prompts.ts          # prompt builder（安全ガイドライン内蔵）
    tools/
      uso-zatsugaku.ts
      world-bug-report.ts
      micro-conspiracy.ts
      zatsudan.ts
      util.ts
      prompts.test.ts     # prompt builder の単体テスト
    data/
      word-pool.json
      world-topics.json
      conspiracy-topics.json
  wrangler.jsonc
  package.json
  tsconfig.json
```

## 出力方針・安全性

- 出力は短く、会話ロボット（ｽﾀｯｸﾁｬﾝ等）が読み上げても自然な文体を意識しています。
- 医療・法律・金融・安全保障・災害・差別・政治煽動などの高リスク領域は避けます。
- ユーザー入力（`theme` / `topic`）は system 指示に混ぜず、材料データとしてのみ扱います（prompt injection 対策）。
- 繰り返しますが、**出力は事実ではありません。雑談のためのネタです。**
