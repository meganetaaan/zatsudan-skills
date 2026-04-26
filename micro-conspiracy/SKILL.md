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
目的: ...
黒幕: ...
証拠: ...
```

## Inputs

- If the user gives a topic, use it directly. Examples: `リモコン`, `消しゴム`, `自販機`, `スマホ`.
- If omitted, draw one topic from the skill's local topic bag:
  `node scripts/random-topic.mjs`

If the random topic is sensitive, political, medical, violent, or about a real person/company, rerun the helper.

## Workflow

Do this internally. Do not show reasoning.

1. Pick a tiny inconvenience or odd physical feature around the topic.
2. Treat an ordinary event as deliberate interference.
3. Invent who benefits and why.
4. Choose a harmless "黒幕": a sentient object, room, habit, fake industry group, or obviously fictional secret society.
5. Add one visual "証拠" that is actually ordinary but can be over-interpreted.

Use paranoia-shaped mechanics as comedy, without mentioning mental health:

- Intentionality: accidental behavior is framed as deliberate.
- Reference: an irrelevant detail is treated as a message aimed at the user.
- Hidden beneficiary: someone or something gains from the inconvenience.
- Selective evidence: one tiny observation is treated as decisive proof.
- Unfalsifiability: failed evidence is also suspicious, but keep it light.

## Writing Rules

- Write in Japanese.
- Keep the whole answer under 5 lines.
- Make the claim absurd but not hostile.
- Use no real person, real company, real organization, politics, illness, disaster, crime, discrimination, or safety/legal/financial advice.
- Good black幕 examples: ソファ, 玄関, 冷蔵庫, 二度寝, 未読通知, 余白, 充電ケーブル, 日本すき間保存協会, 秘密結社リモコン解放軍.
- If using people or groups, make them clearly fictional and harmless: `最後の一口管理委員会`, `全国ふせん再配置連盟`, `秘密結社イヤホン片耳派`.
- Prefer domestic-scale stakes: sofa gaps, pockets, drawers, crumbs, buttons, labels, charging cables.

## Examples

```markdown
小規模陰謀論

対象: リモコン
主張: リモコンは人間をソファから立たせるため、わざと隙間へ移動する
目的: 座りっぱなしの人間に最低限の運動をさせる
黒幕: 秘密結社リモコン解放軍
証拠: 探している時だけ音量ボタンが下を向いている
```
