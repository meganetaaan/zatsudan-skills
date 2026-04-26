#!/usr/bin/env python3

import json
import re
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def parse_frontmatter(path: Path) -> dict[str, str]:
    text = path.read_text()
    match = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if not match:
        fail(f"{path}: missing YAML frontmatter")

    fields = {}
    for line in match.group(1).splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        fields[key.strip()] = value.strip().strip('"')
    return fields


def validate_skill(skill_dir: Path) -> None:
    skill_md = skill_dir / "SKILL.md"
    if not skill_md.exists():
        fail(f"{skill_dir}: missing SKILL.md")

    fields = parse_frontmatter(skill_md)
    name = fields.get("name")
    description = fields.get("description")
    if not name:
        fail(f"{skill_md}: missing name")
    if not description:
        fail(f"{skill_md}: missing description")
    if name != skill_dir.name:
        fail(f"{skill_md}: name {name!r} does not match folder {skill_dir.name!r}")

    agents_yaml = skill_dir / "agents" / "openai.yaml"
    if not agents_yaml.exists():
        fail(f"{skill_dir}: missing agents/openai.yaml")

    random_words = skill_dir / "scripts" / "random-words.mjs"
    if random_words.exists():
        result = subprocess.run(
            ["node", str(random_words), "--count", "3", "--theme", "test"],
            check=True,
            text=True,
            stdout=subprocess.PIPE,
        )
        payload = json.loads(result.stdout)
        if payload["words"][0] != "test" or len(payload["words"]) != 3:
            fail(f"{random_words}: invalid random word output")

    word_pool = skill_dir / "references" / "word-pool.json"
    if word_pool.exists():
        payload = json.loads(word_pool.read_text())
        words = payload.get("words", [])
        if len(words) < 1000:
            fail(f"{word_pool}: expected at least 1000 words")
        for item in words[:10]:
            if "word" not in item or "category" not in item:
                fail(f"{word_pool}: malformed word item")


def main() -> None:
    skills = [path for path in ROOT.iterdir() if (path / "SKILL.md").exists()]
    if not skills:
        fail("no skills found")
    for skill_dir in sorted(skills):
        validate_skill(skill_dir)
    print(f"Validated {len(skills)} skill(s).")


if __name__ == "__main__":
    main()
