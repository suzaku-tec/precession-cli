import FinanceReport from "../tasks/financeReport.ts";
import logger from '../util/logger.ts';
import { Command } from 'commander';

// 引数処理
const program = new Command();
program.option('-d, --date', 'target date');
program.parse(process.argv);
const options = program.opts();

// 処理対象日付の取得
const targetDate = options.date ? new Date(options.date) : new Date();

const fr = new FinanceReport();
await fr.getNikkei225PriceReport(targetDate);
