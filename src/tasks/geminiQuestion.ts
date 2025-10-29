import GenUtil from "../util/genUtil.ts";
import * as fs from 'fs/promises';
import * as path from 'path';
import logger from "../util/logger.ts";

export default class GeminiQuestion implements TaskExecutor {

  execute(taskInfo: TaskInfo, args: string[]): void {
    if (!args || args.length != 1 || !args[0]) {
      logger.error("引数を指定してください");
      return;
    }

    GenUtil.getInstance().question(args[0]).then(async (answer) => {
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
# リクエスト
modelVersion: ${answer.modelVersion}
responseId: ${answer.responseId}
createTime: ${answer.createTime}
usageMetadata: ${JSON.stringify(answer.usageMetadata, null, 2)}

# 質問
question: ${args[0]}

# feedback
${answer.promptFeedback ?? "None Feedback"}

# 回答
${answer.text ?? ""}`;

      await fs.writeFile(filePath, writeData, 'utf-8');
      logger.info(`Writing response data to file: ${filePath}`);
    });
  }
}
