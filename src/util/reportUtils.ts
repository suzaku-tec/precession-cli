import * as fs from 'fs/promises';
import * as path from 'path';
import logger from "../util/logger.ts";

export default class ReportUtils {

  private static instance: ReportUtils;

  constructor() { }

  public static getInstance(): ReportUtils {
    if (!ReportUtils.instance) {
      ReportUtils.instance = new ReportUtils();
    }

    return ReportUtils.instance;
  }

  async writeReportDateDir(fileName: string, data: string): Promise<void> {
    let root = path.resolve('./report/ollama');
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    path.join(root, year.toString(), month, day);
    const dirPath = path.join(root, year.toString(), month, day);
    // フォルダ作成（なければ作る・再帰オプション）
    await fs.mkdir(dirPath, { recursive: true });
    return this.writeReportFile(dirPath, fileName, data);
  }

  writeReportFile(dirPath: string, fileName: string, data: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // フォルダ作成（なければ作る・再帰オプション）
        const filePath = path.join(dirPath, fileName);
        await fs.writeFile(filePath, data, 'utf-8');
        logger.debug(`Creating directory: ${dirPath}`);
        return resolve();
      } catch (err) {
        logger.error(`ディレクトリ作成失敗: ${dirPath}`, err);
        return reject(err);
      }
    });
  }
}
