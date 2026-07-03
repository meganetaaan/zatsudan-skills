import { Hono } from "hono";
import { StreamableHTTPTransport } from "@hono/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Env } from "./env";

import {
  usoZatsugakuInputSchema,
  generateUsoZatsugaku,
} from "./tools/uso-zatsugaku";
import {
  worldBugReportInputSchema,
  generateWorldBugReport,
} from "./tools/world-bug-report";
import {
  microConspiracyInputSchema,
  generateMicroConspiracy,
} from "./tools/micro-conspiracy";
import { zatsudanInputSchema, generateZatsudan } from "./tools/zatsudan";

/**
 * リクエストごとに MCP server を生成する（MVP は stateless）。
 * tool handler は closure 経由で `env` にアクセスする。
 */
function buildMcpServer(env: Env): McpServer {
  const server = new McpServer({
    name: "zatsudan-mcp",
    version: "0.1.0",
  });

  server.registerTool(
    "generate_uso_zatsugaku",
    {
      title: "嘘雑学ジェネレーター",
      description:
        "もっともらしいが架空の『嘘雑学』を生成します。theme と count(1〜5) を任意で指定できます。",
      inputSchema: usoZatsugakuInputSchema,
    },
    async (input) => generateUsoZatsugaku(env, input),
  );

  server.registerTool(
    "generate_world_bug_report",
    {
      title: "世界のバグ報告",
      description:
        "日常現象を『世界のバグ報告』風の書式で生成します。topic を任意で指定できます。",
      inputSchema: worldBugReportInputSchema,
    },
    async (input) => generateWorldBugReport(env, input),
  );

  server.registerTool(
    "generate_micro_conspiracy",
    {
      title: "小さな陰謀論",
      description:
        "日常の小さな現象に対するくだらない陰謀論風ネタを生成します。topic を任意で指定できます。",
      inputSchema: microConspiracyInputSchema,
    },
    async (input) => generateMicroConspiracy(env, input),
  );

  server.registerTool(
    "generate_zatsudan",
    {
      title: "雑談ジェネレーター（統合）",
      description:
        "嘘雑学・世界のバグ報告・小さな陰謀論を内部的に選び、そのまま使える短い雑談を生成します。",
      inputSchema: zatsudanInputSchema,
    },
    async (input) => generateZatsudan(env, input),
  );

  return server;
}

const app = new Hono<{ Bindings: Env }>();

// ヘルスチェック。
app.get("/", (c) => c.text("zatsudan-mcp is running"));

/**
 * 簡易 Bearer token 認証。
 * ZATSUDAN_API_KEY が空/未設定ならローカル開発用として認証をスキップする。
 */
app.use("/mcp", async (c, next) => {
  const apiKey = c.env.ZATSUDAN_API_KEY?.trim();
  if (apiKey) {
    const auth = c.req.header("Authorization") ?? "";
    const expected = `Bearer ${apiKey}`;
    if (auth !== expected) {
      return c.json({ error: "Unauthorized" }, 401);
    }
  }
  await next();
});

// MCP Streamable HTTP Transport（GET/POST/DELETE を扱う）。
app.all("/mcp", async (c) => {
  const server = buildMcpServer(c.env);
  const transport = new StreamableHTTPTransport();
  await server.connect(transport);
  const response = await transport.handleRequest(c);
  return response ?? c.body(null, 204);
});

export default app;
