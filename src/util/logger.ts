// logger.ts
import winston from 'winston';
import DailyRotateFile from "winston-daily-rotate-file"; // ESM対応可能

const rotateTransport = new DailyRotateFile({
  filename: "logs/app-%DATE%.log",      // ファイル名。%DATE%に日付挿入
  datePattern: "YYYY-MM-DD",            // 日ごとにローテーション
  maxSize: "10m",                       // 10MBで分割
  maxFiles: "7d",                       // 7日間分だけ保持
  zippedArchive: true,                  // 古いログをzipで圧縮
});

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}][${level.toUpperCase()}] ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    rotateTransport
  ]
});

export default logger;
