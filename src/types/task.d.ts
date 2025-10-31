interface TaskInfo {
  name: string;
  execDate: string;
}

interface TaskExecutor {
  execute(taskInfo: TaskInfo, paramConfig: TaskParam): void;
}

interface TaskConfig {
  name: string;
  cron: string;
  module: string; // モジュールパス
  comment?: string; // moduleの説明（任意）
  param?: TaskParam;
};

interface TaskParam {
}

interface GeminiQuestionParam extends TaskParam {
  prompt: string;
}
