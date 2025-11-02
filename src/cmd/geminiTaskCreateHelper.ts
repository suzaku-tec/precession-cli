import fs from 'fs';
import path from 'path';

/** タスク名を追記 */
const name: string[] = [
];

/** プロンプトの文字列を追記 */
const prompt: string[] = [];


if (name.length !== prompt.length) {
  throw new Error("nameとpromptの数が一致しません。");
}

const output = path.resolve('create_gemini_question.txt');
for (let i = 0; i < name.length; i++) {
  const entry = `
  {
    "cron": "${i + 20} 8 * * 5",
    "name": "${name[i]}",
    "question": "${prompt[i]!.replace(/\n/g, "\\n")}"
  },
`;
  fs.appendFileSync(output, entry, 'utf-8');
}
