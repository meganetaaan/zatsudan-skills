#!/usr/bin/env python3

import argparse
import json
from pathlib import Path

from wordfreq import zipf_frequency


SKILL_DIR = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = SKILL_DIR / "references" / "source-words-filtered.json"
DEFAULT_OUTPUT = SKILL_DIR / "references" / "word-pool.json"

BOOST_WORDS = {
    "acorn",
    "algae",
    "ant",
    "apple",
    "bamboo",
    "bark",
    "bat",
    "beak",
    "bean",
    "bee",
    "beetle",
    "berry",
    "birch",
    "bird",
    "branch",
    "bug",
    "cactus",
    "carrot",
    "cedar",
    "cherry",
    "claw",
    "clover",
    "coral",
    "corn",
    "crab",
    "deer",
    "duck",
    "eagle",
    "egg",
    "feather",
    "fern",
    "fin",
    "fish",
    "flower",
    "fox",
    "frog",
    "fruit",
    "fur",
    "gill",
    "goat",
    "grape",
    "grass",
    "herb",
    "honey",
    "ivy",
    "leaf",
    "lemon",
    "lizard",
    "maple",
    "moss",
    "moth",
    "mouse",
    "nest",
    "oak",
    "ocean",
    "otter",
    "owl",
    "peach",
    "pear",
    "pine",
    "pollen",
    "pond",
    "rabbit",
    "rice",
    "root",
    "rose",
    "scale",
    "seed",
    "shell",
    "snail",
    "snake",
    "spider",
    "stem",
    "straw",
    "swan",
    "tail",
    "thorn",
    "tree",
    "tulip",
    "vine",
    "web",
    "whale",
    "wing",
    "wolf",
    "worm",
}

CATEGORY_HINTS = {
    "biology": BOOST_WORDS,
    "everyday": {
        "basket",
        "bell",
        "book",
        "bottle",
        "bowl",
        "box",
        "brush",
        "button",
        "candle",
        "chair",
        "clock",
        "cloth",
        "coin",
        "cup",
        "door",
        "drawer",
        "fork",
        "glass",
        "hammer",
        "hat",
        "hook",
        "jar",
        "kettle",
        "key",
        "lamp",
        "map",
        "mirror",
        "needle",
        "paper",
        "pencil",
        "plate",
        "pocket",
        "rope",
        "shelf",
        "shoe",
        "spoon",
        "table",
        "thread",
        "ticket",
        "towel",
        "wheel",
        "window",
    },
    "food": {
        "bread",
        "butter",
        "cake",
        "cheese",
        "coffee",
        "cookie",
        "cream",
        "egg",
        "flour",
        "honey",
        "jam",
        "juice",
        "milk",
        "noodle",
        "pepper",
        "pie",
        "rice",
        "salt",
        "soup",
        "sugar",
        "tea",
        "toast",
        "wheat",
    },
}


def category_for(word: str) -> str:
    for category, words in CATEGORY_HINTS.items():
        if word in words:
            return category
    return "general"


def score_word(word: str) -> float:
    frequency = zipf_frequency(word, "en")
    length_bonus = 0.25 if 4 <= len(word) <= 8 else 0.0
    category_bonus = 0.45 if word in BOOST_WORDS else 0.0
    return frequency + length_bonus + category_bonus


def build_pool(words: list[str], target: int) -> list[dict]:
    scored = []
    for word in words:
        frequency = zipf_frequency(word, "en")
        if frequency < 2.5:
            continue
        if frequency < 3.5 and word not in BOOST_WORDS:
            continue
        scored.append(
            {
                "word": word,
                "frequency": round(frequency, 3),
                "score": round(score_word(word), 3),
                "category": category_for(word),
            }
        )

    scored.sort(key=lambda item: (-item["score"], item["word"]))

    selected = []
    seen = set()

    for category in ("biology", "food", "everyday"):
        for item in scored:
            if item["category"] == category and item["word"] not in seen:
                selected.append(item)
                seen.add(item["word"])

    for item in scored:
        if len(selected) >= target:
            break
        if item["word"] in seen:
            continue
        selected.append(item)
        seen.add(item["word"])

    selected.sort(key=lambda item: item["word"])
    return selected[:target]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--target", type=int, default=2000)
    args = parser.parse_args()

    words = json.loads(args.input.read_text())
    pool = build_pool(words, args.target)

    payload = {
        "metadata": {
            "source": "RazorSh4rk/random-word-api words.json",
            "source_url": "https://github.com/RazorSh4rk/random-word-api/blob/master/words.json",
            "license": "WTFPL",
            "input_count": len(words),
            "word_count": len(pool),
            "method": "format filter, inflection filter, safety blocklist, wordfreq Zipf frequency, small category boosts",
        },
        "words": pool,
    }

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, indent=2) + "\n")

    counts = {}
    for item in pool:
        counts[item["category"]] = counts.get(item["category"], 0) + 1

    print(
        json.dumps(
            {
                "input": len(words),
                "output": len(pool),
                "categories": counts,
                "sample": [item["word"] for item in pool[:40]],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
