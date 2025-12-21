import fs from 'fs';
import path from 'path';
import logger from '../util/logger.ts';
import { jobs } from '../db/schema.ts';
import { db, initDatabase } from '../db/db.ts';
import { count, eq } from 'drizzle-orm';

// 質問JSONファイルの読み込み
logger.debug("Loading question list...");
const questionListPath = path.resolve('config/questionList.json');
const questions: Question[] = JSON.parse(fs.readFileSync(questionListPath, 'utf8'));

// タスクJSONファイルの読み込み
logger.debug("Loading task configuration...");
const tasksPath = path.resolve('config/tasks.json');
const tasks: TaskConfig[] = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));

// gemini以外の質問の設定リストを抽出
const newTasks = tasks.filter((item) => {
  return item.module.indexOf('ollamaSearxngQuestion') === -1;
});
logger.debug(`Existing tasks count (excluding ollamaSearxngQuestion): ${newTasks.length}`);

await initDatabase();

for (const question of questions) {
  const task: TaskConfig = {
    job_id: -1,
    name: `${question.name}`,
    cron: question.cron,
    module: 'dist/tasks/ollamaSearxngQuestion.js',
    param: {
      prompt: question.question
    }
  };

  logger.info(`Adding new task: ${task.name}`);
  newTasks.push(task);

}


// JSONファイルの書き込み
logger.debug("Writing task configuration...");
fs.writeFileSync(tasksPath, JSON.stringify(newTasks, null, 2), 'utf8');
logger.info(`Updated task configuration written to ${tasksPath}`);

// データベースに新しいタスクを登録
for (const task of newTasks) {
  await db.select({ count: count() })
    .from(jobs)
    .where(eq(jobs.name, task.name))
    .then(res => {
      const jobCount = res[0]?.count ?? 0;
      logger.info(`Database query result for task "${task.name}":${jobCount}`);
      return jobCount > 0
    })
    .then(async exists => {
      logger.info(`Task "${task.name}" existence check: ${exists ? 'Exists' : 'Does not exist'}`);
      if (!exists) {
        await db.insert(jobs).values([
          {
            name: task.name,
            module: task.module,
            cron: task.cron,
            param: JSON.stringify(task.param),
            isActive: true,
            description: `Ollama Searxng question task for: ${task.name}`,
            createdAt: new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' }),
            updatedAt: new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })
          }
        ]);
      }
    });
}
