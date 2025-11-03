import fs from 'fs';
import path from 'path';

export default class TemplateUtils {

  public static replacePlaceholders(template: string, values?: Record<string, string>): string {
    return template.replace(/{{(.*?)}}/g, (_, key) => {

      // フォーマットによる置換処理
      switch (key.substring(0, key.indexOf(":") + 1)) {
        case "fmt:":
          return TemplateUtils.getFmtFileStr(key);
        default:
          if (values) {
            return values[key] ?? `{{${key}}}`;
          } else {
            return `{{${key}}}`;
          }
      }
    });
  }

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

}
