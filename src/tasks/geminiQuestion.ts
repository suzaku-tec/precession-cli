import GenUtil from "../util/genUtil.ts";
import * as fs from 'fs/promises';
import * as path from 'path';
import logger from "../util/logger.ts";

export default class GeminiQuestion implements TaskExecutor {

  execute(taskInfo: TaskInfo, taskParam: GeminiQuestionParam): void {
    if (!taskParam) {
      logger.error("引数を指定してください");
      return;
    }

    if (!taskParam.prompt) {
      logger.error("promptを指定してください");
      logger.error(JSON.stringify(taskParam));
      return;
    }

    GenUtil.getInstance().question(taskParam.prompt).then(async (answer) => {
      let root = path.resolve('./report/gemini');
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');

      const fileName = year.toString() + month + day + '_' + taskInfo.name + '_answer.md';

      const dirPath = path.join(root, year.toString(), month, day);

      // フォルダ作成（なければ作る・再帰オプション）
      await fs.mkdir(dirPath, { recursive: true });
      logger.debug(`Creating directory: ${dirPath}`);

      // ファイルパス作成+出力
      const filePath = path.join(dirPath, fileName);

      const writeData = `
# 質問
${taskParam.prompt}

# 回答
${answer.text ?? ""}

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
    });
  }
}
