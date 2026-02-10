import axios from 'axios';
import { parse } from 'csv-parse/sync';
import logger from './logger.ts';

export type Nikkei225Component = {
  code: string;     // "7203"
  company: string;  // "トヨタ自動車"
  sector?: string;
  weight?: number;
};

export type StooqClosePrice = {
  code: string;      // "7203"
  date: string | undefined;      // "2026-02-07"
  high: number;
  low: number;
  close: number;     // 2850
  volume: number;
};

export type Nikkei225PriceReport = {
  code: string;     // "7203"
  company: string;  // "トヨタ自動車"
  sector: string | undefined;
  date: string | undefined;      // "2026-02-07"
  close: number;     // 2850
};

export default class FinanceUtil {

  private static instance: FinanceUtil;

  private constructor() { }

  public static getInstance(): FinanceUtil {
    if (!FinanceUtil.instance) {
      FinanceUtil.instance = new FinanceUtil();
      logger.info("FinanceUtil instance created.");
    }

    return FinanceUtil.instance;
  }

  async getNikkei225List(): Promise<Nikkei225Component[]> {
    // 日経平均プロフィールの構成銘柄CSVのURL
    const url = 'https://indexes.nikkei.co.jp/nkave/archives/file/nikkei_stock_average_components_sample(today).csv';

    const response = await axios.get(url, { responseType: 'arraybuffer' });
    logger.info("Fetched Nikkei 225 components CSV.");
    const csvText = response.data;

    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true
    }) as Record<string, string>[];

    // 1列目が銘柄コード
    return records
      .filter(row => {
        const code = row["Code"]?.trim();
        return code && /^\d{4}$/.test(code);
      })
      .map((row) => {
        const code = row["Code"]?.trim();
        return {
          code,
          company: row["Company Name"] ?? row["Company"] ?? "",
          sector: row["Sector"],
          weight: row["Weight"] ? Number(row["Weight"]) : undefined,
        } as Nikkei225Component;
      }).filter((item): item is Nikkei225Component => item !== null);
  }

  async fetchPreviousCloseFromStooq(
    code: string
    , targetDate: Date
  ): Promise<StooqClosePrice | null> {

    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
    const dd = String(targetDate.getDate()).padStart(2, "0");
    const yyyymmdd = `${yyyy}${mm}${dd}`;

    const symbol = `${code}.jp`;
    const url = `https://stooq.com/q/l/?s=${symbol}&f=sd2ohlcv&h&e=csv&&d1=${yyyymmdd}&d2=${yyyymmdd}`;

    try {
      const res = await axios.get(url, {
        timeout: 10_000,
        responseType: "text",
      });
      logger.debug(`Fetched Stooq data for ${code} on ${yyyymmdd}.`);

      const records = parse(res.data, {
        columns: true,
        skip_empty_lines: true,
      }) as Record<string, string>[];

      if (!records.length) return null;

      const row = records[0];

      const close = Number(row!.Close);
      if (Number.isNaN(close)) return null;

      const high = Number(row!.High);
      if (Number.isNaN(high)) return null;

      const low = Number(row!.Low);
      if (Number.isNaN(low)) return null;

      const volume = Number(row!.Volume);
      if (Number.isNaN(volume)) return null;

      return {
        code,
        date: row!.Date,
        high,
        low,
        close,
        volume,
      };
    } catch (err) {
      console.error(`Stooq fetch failed: ${code}`, err);
      return null;
    }
  }

}

