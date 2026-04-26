---
name: world-bug-report
description: Create a short Japanese "real-world bug report" for a mundane topic. Use when the user asks for 現実バグ, world bug report, "〜のバグ", "〜が壊れるバグ", or wants an absurdly structured bug ticket for everyday conversation; accepts an optional 1-3 word topic and defaults to a random everyday topic.
---

# World Bug Report

## Purpose

Turn an everyday annoyance into a fake software bug report. Keep it short enough for voice chat and funny because the format is too serious for the topic.

Default output:

```markdown
現実バグ報告

概要: ...
影響度: ...
再現手順: ...
期待結果: ...
実際結果: ...
```

## Inputs

- If the user gives a topic, use it directly. Examples: `傘`, `冷蔵庫`, `スマホ`, `駅`.
- If omitted, draw one topic from the skill directory:
  `node scripts/random-topic.mjs`

If the random topic is too sensitive, abstract, political, medical, violent, or hard to picture, rerun the helper.

## Workflow

Do this internally. Do not show reasoning.

1. Pick a familiar failure mode around the topic.
2. Make it sound like a deterministic bug with a silly trigger.
3. Add a tiny but vivid consequence.
4. Keep the report to 5 short fields.

## Writing Rules

- Write in Japanese.
- Keep each field to one short sentence.
- Make `再現手順` 2-3 steps joined by ` → `.
- `影響度` should be playful: `低`, `中`, `高`, or `宇宙規模では低`.
- Avoid real people, real companies, politics, illness, disasters, crime, discrimination, and safety/legal/financial advice.
- The bug should feel harmless, local, and oddly reproducible.

## Examples

```markdown
現実バグ報告

概要: 傘を持った日に限って雨が弱まる
影響度: 中。片手がふさがり、少し負けた気分になる
再現手順: 朝の空を見て不安になる → 傘を持つ → 目的地まで小雨以下
期待結果: 安心して濡れない
実際結果: 荷物だけが増える
```
