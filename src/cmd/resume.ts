import { db } from '../db/db.ts';
import { executions, jobs } from '../db/schema.ts';
import { sql, eq } from 'drizzle-orm';
import { CronExpressionParser as parser } from 'cron-parser';
import logger from '../util/logger.ts';
import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';

// JSONファイルの読み込み
logger.debug("Loading task configuration...");
const configPath = path.resolve('config/tasks.json');
const tasks: TaskConfig[] = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const lastExec = db.$with('last_exec').as(
  db.select({
    job_id: executions.jobId,
    executed_at: sql<string>`max(${executions.executedAt})`.as('executed_at'),
  })
    .from(executions)
    .groupBy(executions.jobId)
);

const result = await db
  .with(lastExec)
  .select()
  .from(jobs)
  .leftJoin(lastExec, eq(jobs.id, lastExec.job_id));

logger.debug(result.length + " tasks found in the database.");

tasks.filter(task => {
  const interval = parser.parse(task.cron);
  const prevRun = interval.prev().toDate();

  const lastExecution = result.find(r => r.jobs.id === task.job_id);

  const execResult = prevRun.toLocaleDateString() >= lastExecution?.last_exec?.executed_at!;
  logger.debug(execResult + ": " + task.name + " (last executed at: " + lastExecution?.last_exec?.executed_at + ", previous scheduled run: " + prevRun.toLocaleString() + ")");
  return execResult;
}).forEach(async (task) => {
  logger.info(`Resuming task: ${task.name}`);

});

async function executeRecovery(task: TaskConfig) {
  logger.info(`Recovering task: ${task.name}`);

  // 実行に必要な情報の読み取り
  const absPath = path.resolve(task.module);
  const fileUrl = pathToFileURL(absPath).href;
  const param: TaskParam = task.param || {};
  const taskModule = await import(fileUrl);

  // タスク情報
  const taskInfo: TaskInfo = { name: task.name, execDate: new Date().toLocaleDateString() };

  // 実行メソッド
  const mod = taskModule;
  const job: TaskExecutor = new mod.default();
  await new Promise(resolve => {
    job.execute(taskInfo, param);
    resolve(true);
  });
}
