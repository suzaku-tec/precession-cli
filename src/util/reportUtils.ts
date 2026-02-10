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

  getReportDateDir(targetDate: Date): string {
    let root = path.resolve('./report/ollama');
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    return path.join(root, year.toString(), month, day);
  }

  generateNowDateDir(): Promise<string> {
    return this.generateDateDir(new Date());
  }

  async generateDateDir(targetDate: Date): Promise<string> {
    const dirPath = this.getReportDateDir(targetDate);
    await fs.mkdir(dirPath, { recursive: true });
    return dirPath;
  }

  async writeReportNowDateDir(fileName: string, data: string): Promise<void> {
    const dirPath = await this.generateNowDateDir();
    return this.writeReportFile(dirPath, fileName, data);
  }

  async writeReportDateDir(targetDate: Date, fileName: string, data: string): Promise<void> {
    const dirPath = await this.generateDateDir(targetDate);
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
