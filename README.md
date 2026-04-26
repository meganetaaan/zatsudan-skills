# zatsudan-skills

雑談で使える Codex skills を集めるリポジトリです。

## Skills

### uso-zatsugaku

ユーザー指定のテーマ、またはローカル単語プールから引いた3語をもとに、もっともらしい嘘雑学を3つ生成します。

通常出力:

```markdown
雑学をどうぞ

* ...
* ...
* ...
```

例:

```text
スマホの雑学
```

この場合、`スマホ` を1語目として固定し、残り2語を `uso-zatsugaku/references/word-pool.json` から抽出します。

### world-bug-report

日常のしょうもない現象を、真面目なバグ報告として起票します。

通常出力:

```markdown
現実バグ報告

概要: ...
影響度: ...
再現手順: ...
期待結果: ...
実際結果: ...
```

例:

```text
傘のバグ
```

### micro-conspiracy

日常の小さな現象に、無駄に疑わしい陰謀論を作ります。

通常出力:

```markdown
小規模陰謀論

対象: ...
主張: ...
黒幕: ...
証拠: ...
```

例:

```text
リモコンの陰謀
```

## Install

Codex が読む skills ディレクトリにコピーします。

```bash
mkdir -p "${CODEX_HOME:-$HOME/.codex}/skills"
cp -R uso-zatsugaku world-bug-report micro-conspiracy "${CODEX_HOME:-$HOME/.codex}/skills/"
```

## Validate

```bash
python3 scripts/validate-skills.py
node uso-zatsugaku/scripts/random-words.mjs --count 3 --theme スマホ
node world-bug-report/scripts/random-topic.mjs
node micro-conspiracy/scripts/random-topic.mjs
```

## Word Pool

`uso-zatsugaku` は `RazorSh4rk/random-word-api` の `words.json` を元にしたローカル単語プールを同梱しています。

- Source: https://github.com/RazorSh4rk/random-word-api
- License: WTFPL
- Runtime dependency: Node.js only
- Regeneration dependency: Python `wordfreq`

再生成する場合:

```bash
curl -L https://raw.githubusercontent.com/RazorSh4rk/random-word-api/master/words.json \
  -o uso-zatsugaku/references/words.json
node uso-zatsugaku/scripts/filter-source-words.mjs
uv run --with wordfreq python3 uso-zatsugaku/scripts/build-local-word-pool.py --target 2000
```
