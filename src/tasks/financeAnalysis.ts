import path from "path";
import ReportUtils from "../util/reportUtils.ts";
import fs from "fs";
import { exit } from "process";
import logger from "../util/logger.ts";
import ollama from 'ollama';
import { webSearch } from '../util/searxngUtil.ts';

export default class FinanceAnalysis implements TaskExecutor, TaskParamChecker {
  async execute(taskInfo: TaskInfo, paramConfig: TaskParam): Promise<void> {
    return this.analyze();
  }

  check(param: TaskParam): boolean {
    return true;
  }

  async analyze(): Promise<void> {
    const reportUtils = ReportUtils.getInstance();

    const now = new Date();
    const yestardayStr = this.generateYestardayYyyymmdd(now);

    const dir = reportUtils.getReportDateDir(now);
    const regex = /^nikkei225_prices_.*\.csv$/;

    if (!fs.existsSync(dir)) {
      logger.error("Report directory does not exist.");
      exit(0);
    }

    const files = fs.readdirSync(dir)
      .filter(file => regex.test(file))
      .map(file => path.join(dir, file));

    if (files.length === 0) {
      logger.error("No matching files found.");
      exit(0);
    }

    const targetFile = files[0]!;

    const results = await webSearch(`日経平均株価 ${yestardayStr} ニュース`);

    const webSearchStr = results.map((r: { title: any; url: any; snippet: any; }) => {
      return `##【${r.title}】\n${r.snippet}\n出典: ${r.url}`;
    }).join('\n\n');

    const prompt = `下記の日経平均銘柄の株価データを分析し、以下の点について日本語で回答してください。\n
1. 株価のトレンド（上昇傾向、下降傾向、横ばいなど）\n
2. 特に注目すべき出来事やパターン\n
3. 今後の株価の予測とその根拠\n\n
# 関連する最近のニュース記事:\n
${webSearchStr}\n\n
# 日経平均銘柄の株価情報: \n
${fs.readFileSync(targetFile, 'utf-8')}\n
`;

    return await ollama.chat({
      model: 'gemma3:4b',
      messages: [{ role: 'user', content: prompt }, { role: 'system', content: 'あなたは金融アナリストです。日経平均株価の分析を行い、日本語で回答してください。' }],
    }).then(async (answer) => {
      await reportUtils.writeReportNowDateDir(
        `finance_analysis_${(new Date()).toISOString().slice(0, 10).replace(/-/g, "")}.md`,
        `# 日経225株価分析レポート\n\n${answer.message.content ?? ""} `
      );
    }).then(() => {
      logger.info("Finance analysis report generated successfully.");
    });

  }

  /**
   * 対象日付の前日をyyyy-mm-dd形式で取得する
   * 
   * @param target 対象日付
   * @returns yyyy-mm-dd
   */
  private generateYestardayYyyymmdd(target: Date): string {
    const yestarday = new Date(target);
    yestarday.setDate(target.getDate() - 1);

    const yyyy = yestarday.getFullYear();
    const mm = String(yestarday.getMonth() + 1).padStart(2, '0');
    const dd = String(yestarday.getDate()).padStart(2, '0');

    return `${yyyy} -${mm} -${dd} `;
  }
}

