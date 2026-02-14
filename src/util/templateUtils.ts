import fs from 'fs';
import path from 'path';
import logger from '../util/logger.ts';

type Handler = (key: string) => string;

export default class TemplateUtils {

  public static replacePlaceholders(template: string, values?: Record<string, string>): string {
    return template.replace(/{{(.*?)}}/g, (_, key) => {

      try {
        const result = TemplateUtils.callHandler(key);
        if (result) {
          return result;
        }
      } catch (e) {
        logger.debug(`No handler for key: ${key}, checking values...`);
      }

      if (values) {
        return values[key] ?? `{{${key}}}`;
      }

      return `{{${key}}}`;
    });
  }

  private static handlers: { [prefix: string]: Handler } = {
    "fmt:": (value) => TemplateUtils.getFmtFileStr(value),
    "now": (value) => TemplateUtils.replaceNowPlaceholders(value),
    "today": () => TemplateUtils.formatDate(new Date(), 'YYYY-MM-DD'),
    // 他の予約語の処理をここに追加可能
  };

  // ハンドラ呼び出し例（引数 rawKey は "now-1", "now:xxx" のような文字列）
  private static callHandler = (rawKey: string) => {
    for (const prefix in TemplateUtils.handlers) {
      if (rawKey.startsWith(prefix)) {
        return TemplateUtils.handlers[prefix]!(rawKey);
      }
    }
    // 対応するハンドラがなければ別処理など
    throw new Error("Unknown handler prefix: " + rawKey);
  };

  /**
   * {{}}で囲まれた文字列をすべて抽出する
   * 
   * @param template 
   * @returns 
   */
  private static extractPlaceholders(template: string): string[] {
    // {{}}で囲まれた文字列をすべて抽出する正規表現
    const regex = /{{(.*?)}}/g;
    const matches: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(template)) !== null) {
      matches.push(match[1]!.toString()); // マッチした中身だけを配列に追加（key部分）
    }
    return matches;
  }

  /**
   * 引数で渡された置換文字列に対するフォーマットファイルの文字列を取得する
   * @param repStr 置換文字列
   * @returns 
   */
  private static getFmtFileStr(repStr: string): string {
    logger.info(`Getting format file string for: ${repStr}`);

    // 置換文字列のチェック
    const chkResult: boolean = TemplateUtils.isFmtFile(repStr);
    if (!chkResult) {
      throw new Error(`Invalid format string: ${repStr}`);
    }

    // フォーマットファイルの特定
    const fmtFileName = repStr.replace("fmt:", "").trim();
    const fmtFilePath = path.resolve(`./report/format/${fmtFileName}.md`);

    // ファイルから置き換え用の文字列を取得
    const fileContent = fs.readFileSync(fmtFilePath, "utf-8");

    return fileContent;
  }

  private static isFmtFile(repStr: string): boolean {
    return repStr.startsWith("fmt:");
  }

  static replaceNowPlaceholders(text: string): string {
    logger.info(`Replacing NOW placeholders in text: ${text}`);
    return text.replace(/NOW\s*([+-]\d+[dhm])?(?::([^}]+))?/gi, (match, offset, format) => {
      const now = new Date();

      if (offset) {
        const sign = offset[0]; // '+' or '-'
        const value = parseInt(offset.slice(1, -1)); // 数字部分
        const unit = offset.slice(-1); // 'd', 'h', 'm'

        if (!isNaN(value)) {
          const multiplier = sign === '+' ? 1 : -1;
          switch (unit) {
            case 'd':
              now.setDate(now.getDate() + multiplier * value);
              break;
            case 'h':
              now.setHours(now.getHours() + multiplier * value);
              break;
            case 'm':
              now.setMinutes(now.getMinutes() + multiplier * value);
              break;
          }
        }
      }

      return TemplateUtils.formatDate(now, format);
    });
  }

  static formatDate(date: Date, format?: string): string {
    logger.info(`Formatting date: ${date} with format: ${format}`);
    if (!format) {
      // デフォルトフォーマット
      format = 'YYYY-MM-DD HH:mm:ss';
    }

    return format
      .replace(/YYYY/g, date.getFullYear().toString())
      .replace(/MM/g, (date.getMonth() + 1).toString().padStart(2, '0'))
      .replace(/DD/g, date.getDate().toString().padStart(2, '0'))
      .replace(/HH/g, date.getHours().toString().padStart(2, '0'))
      .replace(/mm/g, date.getMinutes().toString().padStart(2, '0'))
      .replace(/ss/g, date.getSeconds().toString().padStart(2, '0'));
  }

}
