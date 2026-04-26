---
name: uso-zatsugaku
description: Generate three short Japanese fake-trivia items from a user theme or three prompt words. Use when the user asks for 嘘雑学, plausible-but-false trivia, "雑学をどうぞ", or a theme such as "スマホの雑学"; uses a local word pool instead of the what3words API unless official what3words behavior is explicitly requested.
---

# 3語 嘘雑学

## Purpose

Make harmless Japanese fake trivia that sounds briefly believable, then works as "まあ全部ウソなんだけどね".

Default output hides the reasoning process:

```markdown
雑学をどうぞ

* ...
* ...
* ...
```

## Inputs

- If the user gives a theme, keep it as word 1 and draw 2 random words from the skill directory:
  `node scripts/random-words.mjs --count 3 --theme "スマホ"`
- If the user gives 3 words, use them directly. Accept `///a。b。c`, comma-separated, or whitespace-separated forms.
- If neither is given, draw 3 words from the skill directory:
  `node scripts/random-words.mjs --count 3`

The helper prefers at least 2 concrete local-pool words (`biology`, `food`, `everyday`) and may mix 1 general word. If the set includes a personal name, political/military/crime/safety term, pure connector, or a word too abstract to picture, rerun the helper.

## Workflow

Do the following internally. Do not show intermediate sections unless the user asks for the process.

1. Generate 10-15 candidates.
2. Build most candidates from exactly 2 of the 3 words. Cover all pairings: `1+2`, `2+3`, `1+3`. Use all 3 only when stronger.
3. For about 5 promising candidates, add a plausibility bridge:
   - `広く知られる事実`: familiar object, habit, visible feature, custom, industry practice, or everyday observation.
   - `織り交ぜる嘘`: false origin, hidden reason, measuring trick, naming story, ritual, rule of thumb, or invented link.
4. Score the reinforced candidates:
   - `説得力`: reason-to-conclusion bridge is clear.
   - `意外性`: not merely true advice or a normal household tip.
   - `身近さ`: listener can picture the scene quickly.
   - `嘘としての切れ味`: possible for a second, funny when revealed false.
   - `混ざり具合`: at least 2 prompt words are meaningfully used.
5. Pick 3 items with distinct word pairings, settings, and explanation tricks.

## Writing Rules

- Write final trivia in Japanese.
- Make each item one sentence when possible.
- Use concrete details: color, shape, sound, placement, count, hand movement, heat, weight, smell, drying, storage, measurement, memory, or crowd flow.
- Use time/place/industry anchors only when they help. Do not make every item historical or geographic.
- Prefer false origins for familiar things, unrelated facts connected by a neat lie, or real-looking habits with invented reasons.
- Avoid real people, real companies, politics, illness, disasters, crime, discrimination, sensitive attributes, and any false claim that could affect health, safety, legal, or financial decisions.

## Selection Rules

- Drop items that could simply be true practical advice unless the false part is clearly visible.
- Drop items whose familiar object is vague or whose action is hard to picture.
- Drop near-duplicates; do not choose 3 items with the same pair, setting, or trick.
- Favor items that make the user think "本当？" before the reveal.

## Debug Output

Only when the user asks to see the process, use:

```markdown
///{word1}。{word2}。{word3}

## 列挙

・...

## こじつけ補強

・候補...
広く知られる事実: ...
織り交ぜる嘘: ...
→ ...

## 推敲

・...
説得力: ... / 意外性: ... / 身近さ: ... / 嘘としての切れ味: ... / 混ざり具合: ...
→ ...

## トップ3

1. ...
2. ...
3. ...
```
