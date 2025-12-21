/// test.js
import fs from 'fs';
import path from 'path';
import schedule, { Job } from 'node-schedule';
import { pathToFileURL } from 'url';
import logger from './util/logger.ts';
import { db } from './db/db.ts';
import { executions, jobs } from './db/schema.ts';

// JSONファイルの読み込み
logger.debug("Loading task configuration...");
// const configPath = path.resolve('config/tasks.json');
// const tasks: TaskConfig[] = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const jobList = await db.select().from(jobs);

const tasks: TaskConfig[] = jobList.map(row => ({
  job_id: row.id,
  name: row.name,
  cron: row.cron,
  module: row.module, // モジュールパス
  comment: row.description ?? "", // moduleの説明（任意）
  param: row.param ? JSON.parse(row.param) : {} // JSON文字列をオブジェクトに変換
}));

tasks.forEach(async (task) => {
  // 実行に必要な情報の読み取り
  const absPath = path.resolve(task.module);
  const fileUrl = pathToFileURL(absPath).href;
  const param: TaskParam = task.param || {};
  const taskModule = await import(fileUrl);

  // タスク情報
  const taskInfo: TaskInfo = { name: task.name, execDate: new Date().toISOString() };

  // 実行メソッド
  const mod = taskModule;
  const job: (TaskExecutor & TaskParamChecker) = new mod.default();

  // スケジュール登録
  logger.info(`Scheduling task: ${task.name} with cron: ${task.cron}`);
  schedule.scheduleJob(task.name, task.cron, async (fireDate: Date) => {
    if (job.check && !job.check(param)) {
      logger.error(`Task parameter check failed for task: ${task.name}`);

      // 実行履歴に失敗を記録
      insertExecutionRecord(task.job_id, fireDate.toISOString(), taskInfo.execDate, 'failed', 'Parameter check failed');
      return;
    }

    try {
      // タスク実行
      job.execute(taskInfo, param);

      // 実行履歴を登録
      insertExecutionRecord(task.job_id, fireDate.toISOString(), taskInfo.execDate, 'success');
    } catch (error) {

      // エラーハンドリング
      let message = "Unknown error'";
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      }

      // 実行履歴に失敗を記録
      insertExecutionRecord(task.job_id, fireDate.toISOString(), taskInfo.execDate, 'failed', message);
      logger.error(`Error executing task ${task.name}: ${message}`);
    }
  });
});

/**
 * 実行履歴の登録
 * 
 * @param jobId ジョブID
 * @param scheduledAt 実行予定日付
 * @param executedAt 実行日付
 * @param status 実行状態
 * @param errorMessage エラーメッセージ
 */
function insertExecutionRecord(jobId: number, scheduledAt: string, executedAt?: string, status?: 'pending' | 'success' | 'failed', errorMessage?: string) {
  db.insert(executions).values({
    jobId,
    scheduledAt,
    executedAt,
    status,
    errorMessage
  });
}
