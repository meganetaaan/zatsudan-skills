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

## Install

Codex が読む skills ディレクトリにコピーします。

```bash
mkdir -p "${CODEX_HOME:-$HOME/.codex}/skills"
cp -R uso-zatsugaku "${CODEX_HOME:-$HOME/.codex}/skills/"
```

## Validate

```bash
python3 scripts/validate-skills.py
node uso-zatsugaku/scripts/random-words.mjs --count 3 --theme スマホ
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
