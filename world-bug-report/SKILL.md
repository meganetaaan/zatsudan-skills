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
- If omitted, draw one topic from the skill's local topic bag:
  `node scripts/random-topic.mjs`

If the random topic is too sensitive, abstract, political, medical, violent, or hard to picture, rerun the helper.

## Workflow

Do this internally. Do not show reasoning.

1. Pick a familiar object or situation around the topic.
2. Invent an abnormal but physically imaginable trigger that nobody would normally try.
3. Make the result feel like "試したら本当に発生するかも..." while still being clearly silly.
4. Add a tiny but vivid consequence.
5. Keep the report to 5 short fields.

## Writing Rules

- Write in Japanese.
- Keep each field to one short sentence.
- Make `再現手順` 2-3 steps joined by ` → `.
- The trigger must be stranger than everyday "あるある": unopened lids, upside-down use, too many repetitions, wrong angle, exact counts, waiting too long, using the object in the wrong room, or combining two harmless actions.
- Avoid reports that only say "便利すぎて戻れない", "何となくそうなる", or ordinary practical advice.
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

Stronger trigger example:

```markdown
現実バグ報告

概要: 味付き塩コショウを蓋を開けずに振り続けると、台所全体が「もう味付け済み」と判定される
影響度: 高。献立という概念が一時的に停止する
再現手順: 蓋を閉じたまま構える → 1缶ぶん振り続ける → 何も出ていないのに満足する
期待結果: 調味料が出ない
実際結果: もやし、卵、昨日の残り物が同じ味に見えてくる
```
