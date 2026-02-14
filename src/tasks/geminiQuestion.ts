import GenUtil from "../util/genUtil.ts";
import * as fs from 'fs/promises';
import * as path from 'path';
import logger from "../util/logger.ts";
import TemplateUtils from "../util/templateUtils.ts";

export default class GeminiQuestion implements TaskExecutor, TaskParamChecker {
  check(param: TaskParam): boolean {
    if (!param) {
      logger.error("引数を指定してください");
      return false;
    }

    const geminiQuestionParam = param as GeminiQuestionParam;
    if (!geminiQuestionParam.prompt) {
      logger.error("promptを指定してください");
      logger.error(JSON.stringify(geminiQuestionParam));
      return false;
    }

    return true;
  }

  async execute(taskInfo: TaskInfo, taskParam: GeminiQuestionParam): Promise<void> {

    const prompt = TemplateUtils.replacePlaceholders(taskParam.prompt);

    return GenUtil.getInstance().question(prompt).then(async (answer) => {
      let root = path.resolve('./report/gemini');
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');

      const fileName = year.toString() + month + day + '_' + taskInfo.name + '_answer.md';

      const dirPath = taskParam.subDir ? path.join(root, year.toString(), month, day, taskParam.subDir) : path.join(root, year.toString(), month, day);

      // フォルダ作成（なければ作る・再帰オプション）
      await fs.mkdir(dirPath, { recursive: true });
      logger.debug(`Creating directory: ${dirPath}`);

      // ファイルパス作成+出力
      const filePath = path.join(dirPath, fileName);

      const writeData = `
# 回答
${answer.text ?? ""}

# 質問
${prompt}

# リクエスト
modelVersion: ${answer.modelVersion}
responseId: ${answer.responseId}
createTime: ${answer.createTime}
usageMetadata: ${JSON.stringify(answer.usageMetadata, null, 2)}

# feedback
${answer.promptFeedback ?? "None Feedback"}
`;

      await fs.writeFile(filePath, writeData, 'utf-8');
      logger.info(`Writing response data to file: ${filePath}`);
      return Promise.resolve();
    });
  }
}
