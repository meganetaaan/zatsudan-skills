#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_POOL = path.join(scriptDir, "..", "references", "word-pool.json");

function parseArgs(argv) {
  const args = { count: 3, pool: DEFAULT_POOL, theme: undefined };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--count" && argv[i + 1]) {
      args.count = Number(argv[i + 1]);
      i += 1;
    } else if (argv[i] === "--pool" && argv[i + 1]) {
      args.pool = argv[i + 1];
      i += 1;
    } else if (argv[i] === "--theme" && argv[i + 1]) {
      args.theme = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const args = parseArgs(process.argv.slice(2));
if (!Number.isInteger(args.count) || args.count < 1) {
  console.error("--count must be a positive integer.");
  process.exit(2);
}

const payload = JSON.parse(fs.readFileSync(args.pool, "utf8"));
const concrete = payload.words
  .filter((item) => item.category && item.category !== "general")
  .map((item) => item.word);
const allWords = payload.words.map((item) => item.word);

const selected = args.theme ? [args.theme] : [];
const remainingCount = args.count - selected.length;
if (remainingCount < 0) {
  console.error("--count must be at least 1 when --theme is provided.");
  process.exit(2);
}

const concreteCount = Math.min(remainingCount, 2, concrete.length);
selected.push(...shuffle(concrete.filter((word) => !selected.includes(word))).slice(0, concreteCount));
const remaining = shuffle(allWords.filter((word) => !selected.includes(word))).slice(
  0,
  remainingCount - concreteCount,
);
selected.push(...remaining);

if (selected.length < args.count) {
  console.error("Word pool does not contain enough words.");
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      words: selected,
      prompt: `///${selected.join("。")}`,
      source: args.pool,
      theme: args.theme,
    },
    null,
    2,
  ),
);
