import path from "path";
import ReportUtils from "../util/reportUtils.ts";
import fs from "fs";
import { exit } from "process";
import logger from "../util/logger.ts";
import ollama from 'ollama';

export default class FinanceAnalysis implements TaskExecutor, TaskParamChecker {
  execute(taskInfo: TaskInfo, paramConfig: TaskParam): void {
    this.analyze();
  }

  check(param: TaskParam): boolean {
    return true;
  }

  async analyze() {
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

    const prompt = `以下のCSVファイルには、日経225の過去の株価データが含まれています。このデータを分析し、以下の点について回答してください。\n
1. 過去1年間の株価のトレンド（上昇傾向、下降傾向、横ばいなど）\n
2. 特に注目すべき出来事やパターン\n
3. 今後の株価の予測とその根拠\n\n
日経平均銘柄の株価情報:\n
${fs.readFileSync(targetFile, 'utf-8')}`;

    await ollama.chat({
      model: 'gemma3:4b',
      messages: [{ role: 'user', content: prompt }]
    }).then(async (answer) => {
      await reportUtils.writeReportNowDateDir(
        `finance_analysis_${(new Date()).toISOString().slice(0, 10).replace(/-/g, "")}.md`,
        `# 日経225株価分析レポート\n\n${answer.message.content ?? ""}`
      );
    }).then(() => {
      logger.info("Finance analysis report generated successfully.");
    });

  }
}

