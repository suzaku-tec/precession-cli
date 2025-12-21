import { sqliteTable, integer, text, index } from 'drizzle-orm/sqlite-core';
import { sql, relations, param } from 'drizzle-orm';

// ジョブ定義テーブル
export const jobs = sqliteTable('jobs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  cron: text('cron').notNull(),
  module: text('module').notNull(),
  param: text('param'),
  description: text('description'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false), // 0/1
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// 実行履歴テーブル
export const executions = sqliteTable('executions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  jobId: integer('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  scheduledAt: text('scheduled_at').notNull(), // ISO文字列 '2025-12-21T00:00:00Z'
  executedAt: text('executed_at'),
  status: text('status').notNull().$type<'pending' | 'success' | 'failed'>().default('pending'),
  errorMessage: text('error_message'),
});

// リレーション
export const jobsRelations = relations(jobs, ({ many }) => ({
  executions: many(executions),
}));

export const executionsRelations = relations(executions, ({ one }) => ({
  job: one(jobs, {
    fields: [executions.jobId],
    references: [jobs.id],
  }),
}));
