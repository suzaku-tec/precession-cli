interface TaskInfo {
  name: string;
  execDate: string;
}

interface TaskExecutor {
  execute(taskInfo: TaskInfo, paramConfig: TaskParam): void;
}

interface TaskParamChecker {
  check(param: TaskParam): boolean;
}

interface TaskConfig {
  job_id: number;
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
  subDir?: string;
}

interface AudioTaskParam extends TaskParam {
  audioFilePath: string;
}

interface QuestionParam extends TaskParam {
  prompt: string;
  subDir?: string;
}
