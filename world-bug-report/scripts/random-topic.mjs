#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const defaultBag = path.join(scriptDir, "..", "references", "topics.json");

const bagPath = process.argv[2] ?? defaultBag;
const payload = JSON.parse(fs.readFileSync(bagPath, "utf8"));
const topics = payload.topics;
const item = topics[Math.floor(Math.random() * topics.length)];

console.log(JSON.stringify(item, null, 2));
