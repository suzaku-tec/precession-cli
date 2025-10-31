import fs from 'fs';
import path from 'path';
import logger from './util/logger.ts';
import { Command } from 'commander';
import { pathToFileURL } from 'url';

const program = new Command();
program
  .requiredOption('-t, --task <task>', 'task name');
program.parse(process.argv);
const options = program.opts();

logger.info(`Executing task immediately: ${options.task}`);

// JSONファイルの読み込み
logger.debug("Loading task configuration...");
const configPath = path.resolve('config/tasks.json');
const tasks: TaskConfig[] = JSON.parse(fs.readFileSync(configPath, 'utf8'));

tasks.filter(task => task.name === options.task)
  .find(async (task) => {
    logger.info("Checking task: " + task.name);
    logger.info("Found task configuration.");
    // 実行に必要な情報の読み取り
    const absPath = path.resolve(task.module);
    const fileUrl = pathToFileURL(absPath).href;
    const params = task.param || [];
    const taskModule = await import(fileUrl);

    // タスク情報
    const taskInfo: TaskInfo = { name: task.name, execDate: new Date().toISOString() };

    // 実行メソッド
    const mod = taskModule;
    const job: TaskExecutor = new mod.default();
    logger.info(`Executing task: ${task.name} immediately`);
    job.execute(taskInfo, params);
  });
