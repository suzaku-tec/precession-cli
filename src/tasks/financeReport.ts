import ReportUtils from "../util/reportUtils.ts";
import FinanceUtil, { type Nikkei225PriceReport } from "../util/financeUtil.ts";
import logger from "../util/logger.ts";

export default async function execute(targetDate: Date) {
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
      close: price?.close ?? NaN,
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
      item.close.toString(),
    ].map(quote).join(",");
  })];

  await ReportUtils.getInstance().writeReportDateDir(
    targetDate,
    `nikkei225_prices_${(targetDate).toISOString().slice(0, 10).replace(/-/g, "")}.csv`,
    csvLines.join("\n")
  ).then(() => {
    console.log("日経225価格レポートを書き込みました。");
  }).catch((err) => {
    console.error("レポート書き込み失敗:", err);
  });
}

execute(new Date());
