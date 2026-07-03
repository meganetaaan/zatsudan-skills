# tool call サンプル

`/mcp` エンドポイントに対する MCP over Streamable HTTP のリクエスト例です。
`ZATSUDAN_API_KEY` を設定している場合は `Authorization: Bearer <key>` を付けてください。

## tools/list

```bash
curl -sS http://localhost:8787/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'Authorization: Bearer local-dev-key' \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

## generate_uso_zatsugaku

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "generate_uso_zatsugaku",
    "arguments": { "theme": "スマホ", "count": 3 }
  }
}
```

## generate_world_bug_report

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "generate_world_bug_report",
    "arguments": { "topic": "傘" }
  }
}
```

## generate_micro_conspiracy

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "generate_micro_conspiracy",
    "arguments": { "topic": "リモコン" }
  }
}
```

## generate_zatsudan

```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tools/call",
  "params": {
    "name": "generate_zatsudan",
    "arguments": { "topic": "エアコン", "mood": "funny", "genre": "auto" }
  }
}
```

## 認証なしで呼んだ場合（401）

`ZATSUDAN_API_KEY` を設定した状態で `Authorization` を付けずに叩くと 401 が返ります。

```bash
curl -i -sS http://localhost:8787/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
# => HTTP/1.1 401 Unauthorized
```
