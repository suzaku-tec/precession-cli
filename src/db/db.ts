// db.ts（修正版）
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.ts';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd());
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'db.sqlite');
console.log('📁 DB Path:', dbPath);

const sqlite = new Database(dbPath);

export const db = drizzle(sqlite, { schema });

export async function initDatabase() {
  console.log('🛠️  Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });

  // テーブル存在確認
  const jobCount = await db.select().from(schema.jobs).limit(1);
  console.log('✅ Tables ready. Jobs count:', jobCount.length);
}
