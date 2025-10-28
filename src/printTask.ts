import fs from 'fs';
import path from 'path';
import { CronExpressionParser as parser } from 'cron-parser';
import logger from './util/logger.ts';

// JSONファイルの読み込み
logger.debug("Loading task configuration...");
const configPath = path.resolve('config/tasks.json');
const tasks: TaskConfig[] = JSON.parse(fs.readFileSync(configPath, 'utf8'));

tasks.forEach((task) => {
  console.log(`Task Name: ${task.name}`);

  const interval = parser.parse(task.cron);
  const nextRun = interval.next().toDate();
  console.log(`next run: ${nextRun}`);
  console.log(`---`);
});
console.log("end");

