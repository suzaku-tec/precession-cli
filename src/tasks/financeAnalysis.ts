import path from "path";
import ReportUtils from "../util/reportUtils.ts";
import fs from "fs";
import { exit } from "process";
import logger from "../util/logger.ts";
import OllamaSearxngQuestion from "./ollamaSearxngQuestion.ts";

const reportUtils = ReportUtils.getInstance();

const dir = reportUtils.getReportDateDir(new Date());
const regex = /^nikkei225_prices_.*\.csv$/;


const files = fs.readdirSync(dir)
  .filter(file => regex.test(file))
  .map(file => path.join(dir, file));

if (files.length === 0) {
  logger.error("No matching files found.");
  exit(0);
}

const targetFile = files[0]!;
const llm = new OllamaSearxngQuestion();

llm.execute(
  { name: "Finance Analysis", execDate: new Date().toLocaleString() },
  {
    prompt: `以下のCSVファイルには、日経225の過去の株価データが含まれています。このデータを分析し、以下の点について回答してください。\n
1. 過去1年間の株価のトレンド（上昇傾向、下降傾向、横ばいなど）\n
2. 特に注目すべき出来事やパターン\n
3. 今後の株価の予測とその根拠\n\n
CSVファイルの内容:\n
${fs.readFileSync(targetFile, 'utf-8')}`
  }
);
