/// test.js
import fs from 'fs';
import path from 'path';
import schedule from 'node-schedule';
import { pathToFileURL } from 'url';
import logger from './util/logger.ts';

// JSONファイルの読み込み
logger.debug("Loading task configuration...");
const configPath = path.resolve('config/tasks.json');
const tasks: TaskConfig[] = JSON.parse(fs.readFileSync(configPath, 'utf8'));

tasks.forEach(async (task) => {
  // 実行に必要な情報の読み取り
  const absPath = path.resolve(task.module);
  const fileUrl = pathToFileURL(absPath).href;
  const params = task.params || [];
  const taskModule = await import(fileUrl);

  // タスク情報
  const taskInfo: TaskInfo = { name: task.name, execDate: new Date().toISOString() };

  // 実行メソッド
  const mod = taskModule;
  const job: TaskExecutor = new mod.default();

  // スケジュール登録
  logger.info(`Scheduling task: ${task.name} with cron: ${task.cron}`);
  schedule.scheduleJob(task.name, task.cron, () => job.execute(taskInfo, params));
});

