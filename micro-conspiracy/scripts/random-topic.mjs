#!/usr/bin/env node

const topics = [
  "リモコン",
  "消しゴム",
  "自販機",
  "スマホ",
  "イヤホン",
  "靴下",
  "レシート",
  "冷蔵庫",
  "カーテン",
  "エレベーター",
  "傘",
  "ペン",
  "ノート",
  "カバン",
  "コップ",
  "充電ケーブル",
  "ふせん",
  "玄関マット",
  "机の引き出し",
  "冷凍庫",
  "洗濯ばさみ",
  "キーホルダー",
  "スリッパ",
  "カレンダー",
  "紙袋",
];

const topic = topics[Math.floor(Math.random() * topics.length)];
console.log(JSON.stringify({ topic }, null, 2));
