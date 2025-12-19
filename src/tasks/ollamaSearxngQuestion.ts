import * as fs from 'fs/promises';
import * as path from 'path';
import logger from "../util/logger.ts";
import TemplateUtils from "../util/templateUtils.ts";
import OllamaSearxngUtil from "../util/ollamaSearxngUtil.ts";

export default class OllamaSearxngQuestion implements TaskExecutor, TaskParamChecker {
  check(param: TaskParam): boolean {
    if (!param) {
      logger.error("引数を指定してください");
      return false;
    }

    return true;
  }

  execute(taskInfo: TaskInfo, taskParam: QuestionParam): void {

    const prompt = TemplateUtils.replacePlaceholders(taskParam.prompt);

    OllamaSearxngUtil.getInstance().question(prompt).then(async (answer) => {
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
${answer.message.content ?? ""}

# 質問内容
${prompt}

# レスポンス情報
model: ${answer.model};
created_at: ${answer.created_at};
done: ${answer.done};
done_reason: ${answer.done_reason};
total_duration: ${answer.total_duration};
load_duration: ${answer.load_duration};
prompt_eval_count: ${answer.prompt_eval_count};
prompt_eval_duration: ${answer.prompt_eval_duration};
eval_count: ${answer.eval_count};
eval_duration: ${answer.eval_duration};
logprobs?: ${answer.logprobs ?? "None Logprobs"};
`;

      await fs.writeFile(filePath, writeData, 'utf-8');
      logger.info(`Writing response data to file: ${filePath}`);
    });
  }
}
