import fs from 'fs';
import path from 'path';
import logger from './util/logger.ts';

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
  return item.module.indexOf('geminiQuestion') === -1;
});
logger.debug(`Existing tasks count (excluding geminiQuestion): ${newTasks.length}`);

// questionList.jsonの内容をtasksに追加
questions.forEach((question) => {
  const task: TaskConfig = {
    name: `${question.name}`,
    cron: question.cron,
    module: 'dist/tasks/geminiQuestion.js',
    param: [question.question],
  };
  logger.info(`Adding new task: ${task.name}`);
  newTasks.push(task);
});

// JSONファイルの書き込み
logger.debug("Writing task configuration...");
fs.writeFileSync(tasksPath, JSON.stringify(newTasks, null, 2), 'utf8');
logger.info(`Updated task configuration written to ${tasksPath}`);
