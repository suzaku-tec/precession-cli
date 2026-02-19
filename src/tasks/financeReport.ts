import ReportUtils from "../util/reportUtils.ts";
import FinanceUtil, { type Nikkei225PriceReport } from "../util/financeUtil.ts";
import logger from "../util/logger.ts";
import { get } from "http";

export default class FinanceReport implements TaskExecutor, TaskParamChecker {
  check(param: TaskParam): boolean {
    // No specific param checks for now
    return true;
  }
  async execute(taskInfo: TaskInfo, taskParam: TaskParam): Promise<void> {
    await this.getNikkei225PriceReport(new Date());
  }

  async getNikkei225PriceReport(targetDate: Date): Promise<string> {
    const financeUtil = FinanceUtil.getInstance();

    const list = await financeUtil.getNikkei225List();
    logger.info(`Fetched ${list.length} Nikkei 225 components.`);

    let priceList: Nikkei225PriceReport[] = [];
    const header = ["code", "company", "sector", "date", "close"];
    for (const component of list) {
      const price = await financeUtil.fetchPreviousCloseFromStooq(component.code, targetDate);
      priceList.push({
        code: component.code,
        company: component.company,
        sector: component.sector,
        date: price?.date,
        high: price?.high ?? NaN,
        low: price?.low ?? NaN,
        close: price?.close ?? NaN,
        volume: price?.volume ?? NaN,
      });
    }
    logger.info(`Fetched price data for ${priceList.length} components.`);

    const quote = (value: string | number) => {
      const s = String(value).replace(/"/g, '""');
      return `"${s}"`;
    };

    const csvLines = [header.join(","), ...priceList.map(item => {
      return [
        item.code,
        item.company,
        item.sector ?? "",
        item.date ?? "",
        item.high.toString(),
        item.low.toString(),
        item.close.toString(),
        item.volume.toString(),
      ].map(quote).join(",");
    })];

    const csvData = csvLines.join("\n");
    return await ReportUtils.getInstance().writeReportDateDir(
      targetDate,
      `nikkei225_prices_${(targetDate).toISOString().slice(0, 10).replace(/-/g, "")}.csv`,
      csvData
    ).then(() => {
      console.log("日経225価格レポートを書き込みました。");
      return Promise.resolve(csvData);
    }).catch((err) => {
      console.error("レポート書き込み失敗:", err);
      return Promise.reject(err);
    });
  }
}
