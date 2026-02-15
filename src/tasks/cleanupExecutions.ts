import { db } from '../db/db.ts';
import { executions } from '../db/schema.ts';
import { lt } from 'drizzle-orm';
import logger from '../util/logger.ts';

// 1ヶ月前の日付を計算
const date = new Date();
date.setMonth(date.getMonth() - 1);
const threshold = date.toLocaleDateString();

logger.info(`Deleting executions scheduled before: ${threshold}`);

try {
  const deletedRows = await db.delete(executions)
    .where(lt(executions.scheduledAt, threshold))
    .returning();

  logger.info(`Cleanup completed. Deleted ${deletedRows.length} records.`);
} catch (e) {
  logger.error(`Failed to cleanup executions: ${e}`);
  throw e;
}
