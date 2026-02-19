import ReportUtils from "../util/reportUtils.ts";
import ollama, { type Message } from 'ollama';
import { webSearch } from '../util/searxngUtil.ts';
import N255 from "../ollama-tool/n225.ts";

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
`;

    const n255 = new N255();
    const messages: Message[] = [{ role: 'user', content: prompt }, { role: 'system', content: 'あなたは金融アナリストです。日経平均株価の分析を行い、日本語で回答してください。' }];

    const toolsExecutors = [n255];

    let response = await ollama.chat({
      model: 'qwen3',
      messages,
      tools: toolsExecutors.map(te => te.tool),
      think: true
    });

    messages.push(response.message);
    if (response.message.tool_calls && response.message.tool_calls.length > 0) {
      console.log("ツール呼び出しを処理します...");
      for (const call of response.message.tool_calls) {
        const executor = toolsExecutors.find(te => te.functionName === call.function.name);
        if (executor) {
          console.log(`ツール ${call.function.name} を呼び出します...`);
          const result = await executor.execute(executor.convertArgs(call.function.arguments));
          messages.push({ role: 'tool', tool_name: call.function.name, content: result });
        }
      }

      response = await ollama.chat({
        model: 'qwen3',
        messages,
        tools: toolsExecutors.map(te => te.tool),
        think: true
      });
    }

    return await reportUtils.writeReportNowDateDir(
      `finance_analysis_${(new Date()).toISOString().slice(0, 10).replace(/-/g, "")}.md`,
      `# 日経225株価分析レポート\n\n${response.message.content ?? ""} `
    );

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

