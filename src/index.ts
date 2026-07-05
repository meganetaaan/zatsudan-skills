import { Hono } from "hono";
import microTopicsPayload from "../micro-conspiracy/references/topics.json";
import wordPoolPayload from "../uso-zatsugaku/references/word-pool.json";
import worldTopicsPayload from "../world-bug-report/references/topics.json";

type Bindings = {
  AI: Ai;
  ALLOWED_ORIGINS?: string;
};

type JsonRpcId = string | number | null;

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: JsonRpcId;
  method?: string;
  params?: unknown;
};

type JsonRpcResponse =
  | {
      jsonrpc: "2.0";
      id: JsonRpcId;
      result: unknown;
    }
  | {
      jsonrpc: "2.0";
      id: JsonRpcId;
      error: {
        code: number;
        message: string;
        data?: unknown;
      };
    };

type WordEntry = {
  word: string;
  category?: string;
};

type TopicEntry = {
  topic: string;
  category: string;
};

type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
};

type TextGenerationOptions = {
  maxTokens?: number;
};

const TEXT_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast" as const;
const DEFAULT_MAX_TOKENS = 384;
const MAX_ALLOWED_TOKENS = 512;

const PROTOCOL_VERSION = "2025-06-18";
const SUPPORTED_PROTOCOL_VERSIONS = new Set([PROTOCOL_VERSION, "2025-03-26", "2024-11-05"]);

const wordPool = wordPoolPayload as { words: WordEntry[] };
const worldTopics = worldTopicsPayload as { topics: TopicEntry[] };
const microTopics = microTopicsPayload as { topics: TopicEntry[] };

const app = new Hono<{ Bindings: Bindings }>();

const tools = [
  {
    name: "uso_zatsugaku",
    title: "3語 嘘雑学",
    description: "Generate three short Japanese fake-trivia items from a theme or three prompt words.",
    inputSchema: {
      type: "object",
      properties: {
        theme: {
          type: "string",
          description: "Optional Japanese theme. Used as the first prompt word.",
        },
        words: {
          type: "array",
          description: "Optional exact three prompt words. Overrides theme.",
          items: { type: "string" },
          minItems: 3,
          maxItems: 3,
        },
        debug: {
          type: "boolean",
          description: "When true, request a process-oriented debug format.",
          default: false,
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "world_bug_report",
    title: "現実バグ報告",
    description: "Generate a short Japanese fake bug report about a mundane topic.",
    inputSchema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description: "Optional mundane topic. A random local topic is used when omitted.",
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "micro_conspiracy",
    title: "小規模陰謀論",
    description: "Generate a tiny harmless Japanese conspiracy theory.",
    inputSchema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description: "Optional mundane topic. A random local topic is used when omitted.",
        },
      },
      additionalProperties: false,
    },
  },
];

const prompts = [
  {
    name: "uso_zatsugaku",
    title: "3語 嘘雑学",
    description: "3語から、短い日本語の嘘雑学を3つ作る。",
    arguments: [
      {
        name: "theme",
        description: "任意のテーマ。指定すると1語目として使う。",
        required: false,
      },
      {
        name: "words",
        description: "任意の3語。句点・カンマ・空白区切りで指定する。",
        required: false,
      },
    ],
  },
  {
    name: "world_bug_report",
    title: "現実バグ報告",
    description: "日常の現象を、真面目なバグ報告として起票する。",
    arguments: [
      {
        name: "topic",
        description: "任意の題材。省略するとローカル topic bag から選ぶ。",
        required: false,
      },
    ],
  },
  {
    name: "micro_conspiracy",
    title: "小規模陰謀論",
    description: "日常の小さな現象に、無害で absurd な陰謀論を作る。",
    arguments: [
      {
        name: "topic",
        description: "任意の題材。省略するとローカル topic bag から選ぶ。",
        required: false,
      },
    ],
  },
];

app.get("/", (c) =>
  c.json({
    name: "zatsudan-skills-mcp",
    version: "0.1.0",
    endpoint: "/mcp",
    tools: tools.map((tool) => tool.name),
  }),
);

app.options("/mcp", (c) => {
  const origin = c.req.header("Origin");
  if (!isAllowedOrigin(origin, c.env.ALLOWED_ORIGINS)) {
    return c.text("Forbidden origin", 403);
  }
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
});

app.get("/mcp", (c) =>
  new Response(null, {
    status: 405,
    headers: {
      Allow: "POST",
      ...corsHeaders(c.req.header("Origin")),
    },
  }),
);

app.delete("/mcp", (c) =>
  new Response(null, {
    status: 405,
    headers: {
      Allow: "POST",
      ...corsHeaders(c.req.header("Origin")),
    },
  }),
);

app.post("/mcp", async (c) => {
  const origin = c.req.header("Origin");
  if (!isAllowedOrigin(origin, c.env.ALLOWED_ORIGINS)) {
    return c.json(rpcError(null, -32600, "Forbidden origin"), 403, corsHeaders(origin));
  }

  let payload: unknown;
  try {
    payload = await c.req.json();
  } catch {
    return c.json(rpcError(null, -32700, "Parse error"), 400, corsHeaders(origin));
  }

  const response = await handleMessage(c.env, payload);
  if (!response) {
    return new Response(null, { status: 202, headers: corsHeaders(origin) });
  }

  return c.json(response, 200, {
    ...corsHeaders(origin),
    "MCP-Protocol-Version": PROTOCOL_VERSION,
  });
});

async function handleMessage(env: Bindings, payload: unknown): Promise<JsonRpcResponse | JsonRpcResponse[] | null> {
  if (Array.isArray(payload)) {
    if (payload.length === 0) {
      return rpcError(null, -32600, "Invalid Request");
    }
    const responses = (await Promise.all(payload.map((message) => handleSingleMessage(env, message)))).filter(
      (response): response is JsonRpcResponse => response !== null,
    );
    return responses.length > 0 ? responses : null;
  }

  return handleSingleMessage(env, payload);
}

async function handleSingleMessage(env: Bindings, payload: unknown): Promise<JsonRpcResponse | null> {
  if (!isJsonRpcRequest(payload)) {
    return rpcError(null, -32600, "Invalid Request");
  }

  const id = payload.id ?? null;
  if (!payload.method) {
    return rpcError(id, -32600, "Invalid Request");
  }

  try {
    switch (payload.method) {
      case "initialize":
        return rpcResult(id, initialize(payload.params));
      case "notifications/initialized":
      case "notifications/cancelled":
        return null;
      case "ping":
        return rpcResult(id, {});
      case "tools/list":
        return rpcResult(id, { tools });
      case "tools/call":
        return rpcResult(id, await callTool(env, payload.params));
      case "prompts/list":
        return rpcError(id, -32601, "Method not found: prompts/list");
      case "prompts/get":
        return rpcError(id, -32601, "Method not found: prompts/get");
      default:
        return rpcError(id, -32601, `Method not found: ${payload.method}`);
    }
  } catch (error) {
    if (error instanceof RpcInputError) {
      return rpcError(id, -32602, error.message, error.data);
    }
    return rpcError(id, -32603, error instanceof Error ? error.message : "Internal error");
  }
}

function initialize(params: unknown) {
  const requestedVersion = getRecord(params)?.protocolVersion;
  const protocolVersion =
    typeof requestedVersion === "string" && SUPPORTED_PROTOCOL_VERSIONS.has(requestedVersion)
      ? requestedVersion
      : PROTOCOL_VERSION;

  return {
    protocolVersion,
    capabilities: {
      tools: { listChanged: false },
    },
    serverInfo: {
      name: "zatsudan-skills-mcp",
      title: "Zatsudan Skills MCP",
      version: "0.1.0",
    },
    instructions:
      "Use these tools/prompts to prepare Japanese zatsudan outputs. Tool results are final Japanese answers; prompts are for clients that want prompt templates.",
  };
}

async function callTool(env: Bindings, params: unknown): Promise<ToolResult> {
  const record = getRecord(params);
  const name = readString(record, "name");
  const args = getRecord(record.arguments ?? {});

  switch (name) {
    case "uso_zatsugaku":
      return await usoZatsugaku(env, args);
    case "world_bug_report":
      return await worldBugReport(env, args);
    case "micro_conspiracy":
      return await microConspiracy(env, args);
    default:
      throw new RpcInputError(`Unknown tool: ${name}`);
  }
}

async function usoZatsugaku(env: Bindings, args: Record<string, unknown>): Promise<ToolResult> {
  const wordsFromArgs = readOptionalStringArray(args, "words");
  const debug = readOptionalBoolean(args, "debug") ?? false;
  const words =
    wordsFromArgs && wordsFromArgs.length > 0
      ? normalizeExactWords(wordsFromArgs)
      : selectUsoWords(readOptionalString(args, "theme"));

  const prompt = buildUsoZatsugakuPrompt(words, debug);
  const text = await generateText(env, prompt, 448).catch(() => fallbackUsoZatsugaku(words, debug));

  return {
    content: [{ type: "text", text }],
    structuredContent: {
      skill: "uso-zatsugaku",
      words,
      debug,
    },
  };
}

async function worldBugReport(env: Bindings, args: Record<string, unknown>): Promise<ToolResult> {
  const topic = cleanText(readOptionalString(args, "topic")) ?? pick(worldTopics.topics).topic;
  const prompt = `「${topic}」を題材に、日常のしょうもない現象を真面目なバグ報告として日本語で書いてください。

出力は次の形式だけにしてください。

現実バグ報告

概要: ...
影響度: ...
再現手順: ...
期待結果: ...
実際結果: ...

各フィールドは短い一文。再現手順は2-3ステップを「 → 」でつなぐ。トリガーは、普通のあるあるより少し変な条件にしてください。実在人物、実在企業、政治、医療、災害、犯罪、差別、安全・法律・金融助言は避けてください。`;
  const text = await generateText(env, prompt, 384).catch(() => fallbackWorldBugReport(topic));

  return {
    content: [{ type: "text", text }],
    structuredContent: {
      skill: "world-bug-report",
      topic,
    },
  };
}

async function microConspiracy(env: Bindings, args: Record<string, unknown>): Promise<ToolResult> {
  const topic = cleanText(readOptionalString(args, "topic")) ?? pick(microTopics.topics).topic;
  const prompt = `「${topic}」を題材に、日常の小さな現象へ無害で小さすぎる陰謀論を作ってください。

出力は次の形式だけにしてください。

小規模陰謀論

対象: ...
主張: ...
目的: ...
黒幕: ...
証拠: ...

全体を5行程度に収める。黒幕は、物、部屋、習慣、または明らかに架空で無害な団体にしてください。実在人物、実在企業、実在組織、政治、医療、災害、犯罪、差別、安全・法律・金融助言は避けてください。`;
  const text = await generateText(env, prompt, 320).catch(() => fallbackMicroConspiracy(topic));

  return {
    content: [{ type: "text", text }],
    structuredContent: {
      skill: "micro-conspiracy",
      topic,
    },
  };
}

function fallbackWorldBugReport(topic: string): string {
  return `現実バグ報告

概要: ${topic}を手にした瞬間だけ、部屋の空気が少しだけ真面目になります
影響度: 中。なんとなく姿勢まで整います
再現手順: ${topic}を用意する → いつもより少し丁寧に扱う → 生活がやけに整って見える
期待結果: いつも通りに使える
実際結果: ついでに気分まで点検される`;
}

function fallbackMicroConspiracy(topic: string): string {
  return `小規模陰謀論

対象: ${topic}
主張: ${topic}は、うっかり長居させるために少しだけ居心地を良くしてある
目的: 人をその場に留めて、次の行動を1回だけ遅らせる
黒幕: 余白管理委員会
証拠: 片づけたはずの場所ほど、なぜか一番気になる`;
}

function buildUsoZatsugakuPrompt(words: string[], debug: boolean): string {
  const promptMarker = `///${words.join("。")}`;
  if (debug) {
    return `${promptMarker}

以下の3語をお題に、日本語で嘘雑学を作ってください。

# 出力形式
雑学をどうぞ

* ...
* ...
* ...

候補や推敲の手順は出さず、最終的な嘘雑学だけを返してください。`;
  }

  return `${promptMarker}

以下の3語から、短い日本語の嘘雑学を3つ作ってください。

# 出力形式
雑学をどうぞ

* ...
* ...
* ...

各項目はできれば一文。身近な物・動作・色・音・置き場所・数などを具体化し、一瞬だけ本当っぽく見える嘘にしてください。実在人物、実在企業、政治、医療、災害、犯罪、差別、安全・法律・金融判断に関わる主張は避けてください。`;
}

function normalizePromptWords(theme: string | undefined, words: string[] | undefined): string[] {
  if (words && words.length > 0) {
    return normalizeExactWords(words);
  }

  const selected = cleanText(theme) ? [cleanText(theme) as string] : [];
  const remainingCount = 3 - selected.length;
  const concrete = wordPool.words
    .filter((item) => item.category && item.category !== "general")
    .map((item) => item.word)
    .filter((word) => !selected.includes(word));
  const allWords = wordPool.words.map((item) => item.word).filter((word) => !selected.includes(word));

  const concreteCount = Math.min(remainingCount, 2, concrete.length);
  selected.push(...shuffle(concrete).slice(0, concreteCount));
  selected.push(...shuffle(allWords.filter((word) => !selected.includes(word))).slice(0, 3 - selected.length));

  if (selected.length !== 3) {
    throw new RpcInputError("Word pool does not contain enough words.");
  }

  return selected;
}

async function generateText(env: Bindings, prompt: string, maxTokens?: number): Promise<string> {
  if (!env?.AI) {
    throw new Error("AI binding is not configured");
  }

  const clamped = clampTokens(maxTokens ?? DEFAULT_MAX_TOKENS);
  // instruct/chat モデルには `prompt`（補完）ではなく `messages`（チャット）で渡す。
  // 補完形式だと賢いモデルほど指示文ごと継続・エコーしてしまうため、
  // 指示・材料は system ロールに置き、user ロールは生成トリガのみにする。
  const raw = (await env.AI.run(TEXT_MODEL, {
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: "上記の指示に従い、本文だけを出力してください。" },
    ],
    max_tokens: clamped,
    temperature: 0.6,
  })) as unknown;

  const text = extractText(raw);
  if (!text) {
    throw new Error("AI returned empty text");
  }
  return text;
}

function fallbackUsoZatsugaku(words: string[], debug: boolean): string {
  if (debug) {
    return `雑学をどうぞ

* ${words[0] ?? "button"}は、押される前にほんの少しだけ押される準備をしていると言われています。`;
  }
  return `雑学をどうぞ

* ${words[0] ?? "button"}は、見た目の丸さで押し心地を決めています。
* ${words[1] ?? "toast"}の焼き色は、少しだけ音を吸うためにあるそうです。
* ${words[2] ?? "battery"}は、冷えるときだけ元気があるふりをします。`;
}

function clampTokens(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return DEFAULT_MAX_TOKENS;
  }
  return Math.min(Math.floor(value), MAX_ALLOWED_TOKENS);
}

function extractText(raw: unknown): string {
  if (raw == null) return "";
  if (typeof raw === "string") return raw.trim();

  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;

    if (typeof obj.response === "string") return obj.response.trim();

    if (obj.result != null) {
      const nested = extractText(obj.result);
      if (nested) return nested;
    }

    if (Array.isArray(obj.choices) && obj.choices.length > 0) {
      const first = obj.choices[0] as Record<string, unknown>;
      if (typeof first.text === "string") return first.text.trim();
      const message = first.message as Record<string, unknown> | undefined;
      if (message && typeof message.content === "string") {
        return message.content.trim();
      }
    }

    if (typeof obj.output_text === "string") return obj.output_text.trim();
    if (typeof obj.generated_text === "string") return obj.generated_text.trim();
  }

  return "";
}

function selectUsoWords(theme: string | undefined): string[] {
  const selected = cleanText(theme) ? [cleanText(theme) as string] : [];
  const remainingCount = 3 - selected.length;
  const concrete = wordPool.words
    .filter((item) => item.category && item.category !== "general")
    .map((item) => item.word)
    .filter((word) => !selected.includes(word));
  const allWords = wordPool.words.map((item) => item.word).filter((word) => !selected.includes(word));

  const concreteCount = Math.min(remainingCount, 2, concrete.length);
  selected.push(...shuffle(concrete).slice(0, concreteCount));
  selected.push(...shuffle(allWords.filter((word) => !selected.includes(word))).slice(0, 3 - selected.length));

  if (selected.length !== 3) {
    throw new RpcInputError("Word pool does not contain enough words.");
  }

  return selected;
}

function normalizeExactWords(words: string[]): string[] {
  const cleaned = words.map((word) => cleanText(word)).filter((word): word is string => Boolean(word));
  if (cleaned.length !== 3) {
    throw new RpcInputError("words must contain exactly three non-empty strings.");
  }
  return cleaned;
}

function parseWordsArgument(value: string | undefined): string[] | undefined {
  if (!value) {
    return undefined;
  }
  return value
    .split(/[。、,\s/]+/u)
    .map((word) => word.trim())
    .filter(Boolean);
}

function readOptionalStringArray(record: Record<string, unknown>, key: string): string[] | undefined {
  const value = record[key];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    throw new RpcInputError(`${key} must be an array of strings.`);
  }
  return value;
}

function readOptionalBoolean(record: Record<string, unknown>, key: string): boolean | undefined {
  const value = record[key];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "boolean") {
    throw new RpcInputError(`${key} must be a boolean.`);
  }
  return value;
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new RpcInputError(`${key} must be a non-empty string.`);
  }
  return value;
}

function readOptionalString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new RpcInputError(`${key} must be a string.`);
  }
  return value;
}

function cleanText(value: string | undefined): string | undefined {
  const cleaned = value?.trim().replace(/\s+/g, " ");
  return cleaned ? cleaned : undefined;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pick<T>(items: T[]): T {
  if (items.length === 0) {
    throw new RpcInputError("Topic bag is empty.");
  }
  return items[Math.floor(Math.random() * items.length)];
}

function getRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function isJsonRpcRequest(value: unknown): value is JsonRpcRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  const id = record.id;
  return (
    record.jsonrpc === "2.0" &&
    (id === undefined || typeof id === "string" || typeof id === "number" || id === null) &&
    (record.method === undefined || typeof record.method === "string")
  );
}

function rpcResult(id: JsonRpcId, result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, result };
}

function rpcError(id: JsonRpcId, code: number, message: string, data?: unknown): JsonRpcResponse {
  return {
    jsonrpc: "2.0",
    id,
    error: data === undefined ? { code, message } : { code, message, data },
  };
}

function isAllowedOrigin(origin: string | undefined, allowedOrigins: string | undefined): boolean {
  if (!origin) {
    return true;
  }
  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    return false;
  }
  if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
    return true;
  }

  const allowed = (allowedOrigins ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return allowed.includes(origin);
}

function corsHeaders(origin: string | undefined): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "Content-Type, Accept, MCP-Protocol-Version, Mcp-Session-Id, Last-Event-ID",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Expose-Headers": "MCP-Protocol-Version",
    Vary: "Origin",
  };
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

class RpcInputError extends Error {
  data?: unknown;

  constructor(message: string, data?: unknown) {
    super(message);
    this.name = "RpcInputError";
    this.data = data;
  }
}

export default app;
