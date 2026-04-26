#!/usr/bin/env node

const topics = [
  "傘",
  "靴下",
  "冷蔵庫",
  "リモコン",
  "改札",
  "エレベーター",
  "自販機",
  "洗濯物",
  "会議",
  "目覚まし",
  "コンビニ",
  "イヤホン",
  "カバン",
  "机",
  "電子レンジ",
  "通知",
  "鍵",
  "レシート",
  "充電器",
  "ふとん",
  "コーヒー",
  "プリン",
  "カレンダー",
  "玄関",
  "コピー機",
];

const topic = topics[Math.floor(Math.random() * topics.length)];
console.log(JSON.stringify({ topic }, null, 2));
