import { db } from './db/db.ts';
import { executions, jobs } from './db/schema.ts';
import { sql, eq } from 'drizzle-orm';
import { CronExpressionParser as parser } from 'cron-parser';
import logger from './util/logger.ts';
import path from 'path';
import { pathToFileURL } from 'url';

import { Command } from 'commander';

const program = new Command();
program
  .option('-n, --noExecute', 'resume list without executing tasks');
program.parse(process.argv);
const options = program.opts();

const jobList = await db.select().from(jobs);
const tasks: TaskConfig[] = jobList.map(row => ({
  job_id: row.id,
  name: row.name,
  cron: row.cron,
  module: row.module, // モジュールパス
  comment: row.description ?? "", // moduleの説明（任意）
  param: row.param ? JSON.parse(row.param) : {} // JSON文字列をオブジェクトに変換
}));
console.log(tasks.length + " tasks found in the database.");

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

const resumeList = tasks.filter(task => {
  const interval = parser.parse(task.cron);
  const prevRun = interval.prev().toDate();
  const lastExecution = result.find(r => r.jobs.id === task.job_id);
  const execResult = prevRun.toLocaleDateString() >= (lastExecution?.last_exec?.executed_at ?? "");
  logger.info(execResult + ": (last executed at: " + (lastExecution?.last_exec?.executed_at ?? "") + ", previous scheduled run: " + prevRun.toLocaleString() + ") task:" + task.name);
  return execResult;
}).filter((task) => {
  return isResume(task);
});

logger.info(resumeList.length + " tasks to resume.");

for (const task of resumeList) {
  logger.info(`Resuming task: ${task.name}`);
  if (!options.noExecute) {
    await executeRecovery(task);
  }
}


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
  const fireDate = new Date();
  try {
    await job.execute(taskInfo, param);
    await insertExecutionRecord(task.job_id, fireDate.toLocaleString(), taskInfo.execDate, 'success');
    return Promise.resolve();
  } catch (error) {
    // エラーハンドリング
    let message = "Unknown error'";
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    // 実行履歴に失敗を記録
    await insertExecutionRecord(task.job_id, fireDate.toLocaleString(), taskInfo.execDate, 'failed', message);
    logger.error(`Error executing task ${task.name}: ${message}`);
    return Promise.reject(error);
  }
}
function isResume(task: TaskConfig): boolean {

  if (!task.module) {
    return false;
  }
  return 0 <= task.module.indexOf('ollamaSearxngQuestion') || task.module.indexOf('financeAnalysis') >= 0 || task.module.indexOf('financeReport') >= 0;

}

/**
 * 実行履歴の登録
 * 
 * @param jobId ジョブID
 * @param scheduledAt 実行予定日付
 * @param executedAt 実行日付
 * @param status 実行状態
 * @param errorMessage エラーメッセージ
 */
async function insertExecutionRecord(jobId: number, scheduledAt: string, executedAt?: string, status?: 'pending' | 'success' | 'failed', errorMessage?: string): Promise<void> {
  logger.info(`Inserting execution record for jobId: ${jobId}, status: ${status}`);
  await db.insert(executions).values({
    jobId,
    scheduledAt,
    executedAt,
    status,
    errorMessage
  });

  return Promise.resolve();
}
