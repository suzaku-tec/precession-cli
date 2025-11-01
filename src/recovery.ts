/// test.js
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import logger from './util/logger.ts';
import { CronExpressionParser as parser } from 'cron-parser';
import { Command } from 'commander';

const program = new Command();
program
  .option('-h, --hour <hour>', 'Recovery Target Time(h)')
  .option('-m, --minute <min>', 'Recovery Target Time(m)')
  .option('-w, --wait <waitTime>', 'Recovery Wait Time(ms)', '60000');
program.parse(process.argv);
const options = program.opts();

if (!options.hour && !options.minute) {
  logger.error("Please specify both hour and minute for recovery target time.");
  process.exit(1);
}

// JSONファイルの読み込み
logger.debug("Loading task configuration...");
const configPath = path.resolve('config/tasks.json');
const tasks: TaskConfig[] = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const waitTime = options.wait ? parseInt(options.wait) : 60000;

const now = new Date();
const targetDate: Date = (() => {
  const clone = new Date(now);
  if (options.hour) {
    clone.setHours(now.getHours() - parseInt(options.hour));
  }
  if (options.minute) {
    clone.setMinutes(now.getMinutes() - parseInt(options.minute));
  }
  return clone;
})();

logger.info(`Execute the tasks scheduled to run from ${targetDate.toLocaleString()} to ${now.toLocaleString()}.`);

const recoveryTasks = tasks.filter((task) => {
  const interval = parser.parse(task.cron);
  const prevRun = interval.prev().toDate();
  return prevRun >= targetDate && prevRun <= now;
});

async function executeRecovery(task: TaskConfig) {
  logger.info(`Recovering task: ${task.name}`);

  // 実行に必要な情報の読み取り
  const absPath = path.resolve(task.module);
  const fileUrl = pathToFileURL(absPath).href;
  const param: TaskParam = task.param || {};
  const taskModule = await import(fileUrl);

  // タスク情報
  const taskInfo: TaskInfo = { name: task.name, execDate: new Date().toISOString() };

  // 実行メソッド
  const mod = taskModule;
  const job: TaskExecutor = new mod.default();
  await new Promise(resolve => {
    job.execute(taskInfo, param);
    resolve(true);
  });
}

function wait(ms: number): Promise<void> {
  logger.debug(`Waiting for ${ms}ms...`);
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runRecovery() {
  for (const task of recoveryTasks) {
    await executeRecovery(task);
    await wait(waitTime);
  }
  logger.info("Recovery process completed.");
}

runRecovery();


