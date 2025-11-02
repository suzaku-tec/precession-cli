import fs from 'fs';
import path from 'path';
import { CronExpressionParser as parser } from 'cron-parser';
import logger from '../util/logger.ts';
import { Command } from 'commander';

// JSONファイルの読み込み
logger.debug("Loading task configuration...");
const configPath = path.resolve('config/tasks.json');
let tasks: TaskConfig[] = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const program = new Command();
program
  .option('--sort-cron-time', 'sort time in cron expression', false)
  .option('--next-time', 'output next execution time', false)
  .option('--output-field <outputFields...> ', 'output field name of task. outputFields: name, cron, module, comment, param', ["name", "cron", "comment"])
  ;
program.parse(process.argv);
const options = program.opts();

if (options.outputField) {
  const validFields = ['name', 'cron', 'module', 'comment', 'param'];
  const result = options.outputField.every((field: string) => {
    return validFields.includes(field);
  });
  if (!result) {
    logger.error(`Invalid output field specified. Valid fields are: ${validFields.join(', ')}`);
    process.exit(1);
  }
}

function extractHourMinute(cronExpr: string): { hour: number; minute: number } | null {
  const parts = cronExpr.trim().split(/\s+/);
  if (parts.length < 2) return null;
  const minute = parseInt(parts[0]!, 10);
  const hour = parseInt(parts[1]!, 10);
  if (isNaN(minute) || isNaN(hour)) return null;
  return { hour, minute };
}

if (options.sortCronTime) {
  tasks = tasks.sort((a, b) => {
    const timeA = extractHourMinute(a.cron);
    const timeB = extractHourMinute(b.cron);
    if (!timeA || !timeB) return 0;

    // 時と分を分単位に換算して比較
    const totalA = timeA.hour * 60 + timeA.minute;
    const totalB = timeB.hour * 60 + timeB.minute;
    return totalA - totalB;
  });
}

tasks.forEach((task) => {
  options.outputField.forEach((field: string) => {
    if (field in task) {
      process.stdout.write(`${field}:${(task as any)[field]} `);
    }
  });

  if (options.nextTime) {
    const interval = parser.parse(task.cron);
    const nextRun = interval.next().toDate();
    process.stdout.write(`next run: ${nextRun}`);
  }
  console.log("");
});
console.log("end");

