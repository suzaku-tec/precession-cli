import type { Tool } from "ollama";
import FinanceReport from "../tasks/financeReport.ts";

export interface N225ToolCallParams extends ToolCallParams {
  date: string;
}

export default class N225 implements ToolCallExecutor<N225ToolCallParams> {
  readonly functionName = "get_nikkei225_price";

  tool: Tool = {
    type: "function",
    function: {
      name: this.functionName,
      description: "日経平均株価の前営業日の終値を取得する関数",
      parameters: {
        type: "object",
        required: ["date"],
        properties: {
          date: {
            type: "string",
            description: "日付 (YYYY-MM-DD形式)"
          }
        }
      }
    }
  }

  convertArgs(args: { [key: string]: any }): N225ToolCallParams {
    return {
      date: args.date
    } as N225ToolCallParams;
  }

  async execute(params: N225ToolCallParams): Promise<string> {
    const date = new Date(params.date);
    const fr = new FinanceReport();
    return await fr.getNikkei225PriceReport(date);
  }
}
