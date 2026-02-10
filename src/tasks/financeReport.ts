import ReportUtils from "../util/reportUtils.ts";
import FinanceUtil, { type Nikkei225PriceReport } from "../util/financeUtil.ts";

const financeUtil = FinanceUtil.getInstance();

const list = await financeUtil.getNikkei225List();
let priceList: Nikkei225PriceReport[] = [];
const header = ["code", "company", "sector", "date", "close"];
for (const component of list.slice(0, 5)) {
  const price = await financeUtil.fetchPreviousCloseFromStooq(component.code);
  priceList.push({
    code: component.code,
    company: component.company,
    sector: component.sector,
    date: price?.date,
    close: price?.close ?? NaN,
  });
}

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
  `nikkei225_prices_${(new Date()).toISOString().slice(0, 10).replace(/-/g, "")}.csv`,
  csvLines.join("\n")
).then(() => {
  console.log("日経225価格レポートを書き込みました。");
}).catch((err) => {
  console.error("レポート書き込み失敗:", err);
});
