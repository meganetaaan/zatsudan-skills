---
name: micro-conspiracy
description: Create a tiny harmless Japanese conspiracy theory about a mundane topic. Use when the user asks for 小さすぎる陰謀論, micro conspiracy, "〜の陰謀", or wants an absurd explanation with 黒幕 and 証拠; accepts an optional 1-3 word topic and defaults to a random everyday topic.
---

# Micro Conspiracy

## Purpose

Make a harmless conspiracy theory too small to matter. The humor comes from using suspicious language for something obviously mundane.

Default output:

```markdown
小規模陰謀論

対象: ...
主張: ...
黒幕: ...
証拠: ...
```

## Inputs

- If the user gives a topic, use it directly. Examples: `リモコン`, `消しゴム`, `自販機`, `スマホ`.
- If omitted, draw one topic from the skill directory:
  `node scripts/random-topic.mjs`

If the random topic is sensitive, political, medical, violent, or about a real person/company, rerun the helper.

## Workflow

Do this internally. Do not show reasoning.

1. Pick a tiny inconvenience or odd physical feature around the topic.
2. Invent an over-specific motive.
3. Choose a ridiculous but harmless "黒幕" such as an object, industry, room, or habit.
4. Add one visual "証拠" the listener can picture.

## Writing Rules

- Write in Japanese.
- Keep the whole answer under 5 lines.
- Make the claim absurd but not hostile.
- Use no real person, real company, politics, illness, disaster, crime, discrimination, or safety/legal/financial advice.
- Prefer domestic-scale stakes: sofa gaps, pockets, drawers, crumbs, buttons, labels, charging cables.

## Examples

```markdown
小規模陰謀論

対象: リモコン
主張: リモコンは人間をソファから立たせるため、わざと隙間へ移動する
黒幕: クッション業界
証拠: 探している時だけ音量ボタンが下を向いている
```
