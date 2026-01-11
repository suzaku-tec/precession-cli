# Precession CLI - Agent Instructions

## Project Overview
A task scheduling CLI application that runs scheduled jobs using cron expressions. Tasks are dynamically loaded modules that implement `TaskExecutor` and optionally `TaskParamChecker` interfaces. Uses SQLite with Drizzle ORM, Winston logging, and Ollama/Gemini AI integration.

---

## Build Commands

```bash
# Compile TypeScript to dist/
npm run build

# Clean dist/ directory
npm run clean

# Full initialization: clean → build → setup → run
npm run start

# Database migrations (run after schema changes)
npx drizzle-kit push      # Initial setup
npx drizzle-kit generate  # Generate new migrations
```

**Testing:** No test framework configured. To test a specific module:
```bash
npx ts-node src/path/to/module.ts
```

---

## Code Style Guidelines

### Imports
- Use ESM syntax with default imports for most modules: `import fs from 'fs';`
- Use wildcard imports for fs/promises: `import * as fs from 'fs/promises';`
- Relative imports require `./` prefix: `import logger from './util/logger.ts';`
- Import type definitions from `types/` folder: `import type { TaskConfig } from './types/task.d.ts';`

### Type Definitions
- Place shared interfaces in `src/types/*.d.ts`
- Use PascalCase for interface names: `TaskExecutor`, `TaskParam`, `GeminiQuestionParam`
- Use `extends` for parameter types: `interface GeminiQuestionParam extends TaskParam`

### Naming Conventions
- **Classes:** PascalCase (`OllamaSearxngUtil`, `TemplateUtils`)
- **Functions/Variables:** camelCase (`executeTask`, `taskConfig`)
- **Constants:** lowercase or SCREAMING_SNAKE_CASE for special cases
- **Files:** camelCase (`printTask.ts`, `recovery.ts`)
- **Database tables:** lowercase plural (`jobs`, `executions`)

### Error Handling
```typescript
try {
  await someAsyncOperation();
} catch (error) {
  let message = "Unknown error";
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }
  logger.error(`Operation failed: ${message}`);
}
```

### Logging
Use the winston logger instance (configured in `src/util/logger.ts`):
```typescript
import logger from './util/logger.ts';

logger.debug('Debug message');
logger.info('Info message');
logger.error('Error message');
```
Logs are written to `logs/app-YYYY-MM-DD.log` with 7-day retention.

### Database Operations
- Use Drizzle ORM with the exported `db` instance from `src/db/db.ts`
- Follow the schema defined in `src/db/schema.ts`
- All migrations go in `drizzle/` directory
- Use `await db.insert().values()` for inserts and `await db.select().from()` for queries

### Task Module Pattern
All task modules in `src/tasks/` must implement:
```typescript
import type { TaskExecutor, TaskParamChecker, TaskInfo, TaskParam } from '../types/task.d.ts';

export default class MyTask implements TaskExecutor, TaskParamChecker {
  // Optional: Validate parameters before execution
  check(param: TaskParam): boolean {
    return true; // or validation logic
  }

  // Required: Execute the task
  execute(taskInfo: TaskInfo, paramConfig: TaskParam): void {
    // Task implementation
  }
}
```

### CLI Commands
Use `commander` for CLI argument parsing:
```typescript
import { Command } from 'commander';
import { exit } from 'process';

const program = new Command();
program
  .option('-f, --flag', 'description')
  .option('--value <name>', 'parameter description');

program.parse(process.argv);
const options = program.opts();

// Exit with error if validation fails
if (!options.requiredParam) {
  logger.error('Missing required parameter');
  exit(1);
}
```

### Singleton Pattern
Utility classes use singleton pattern:
```typescript
export default class MyUtil {
  private static instance: MyUtil;

  private constructor() { }

  public static getInstance(): MyUtil {
    if (!MyUtil.instance) {
      MyUtil.instance = new MyUtil();
    }
    return MyUtil.instance;
  }
}
```

### File Operations
Prefer async `fs/promises` for file I/O:
```typescript
import * as fs from 'fs/promises';
import path from 'path';

await fs.mkdir(dirPath, { recursive: true });
await fs.writeFile(filePath, content, 'utf-8');
```

### Comments and Documentation
- Use JSDoc for exported functions: `/** @param jobId ... */`
- Comments can be in Japanese or English
- Use Japanese comments for UI-facing strings

### Async Patterns
Always use `async/await` (no raw Promises with `.then()` unless chaining is necessary):
```typescript
async function processData() {
  const data = await fetchData();
  await processMore(data);
}
```

---

## Key Directories
- `src/cmd/` - CLI command entry points
- `src/tasks/` - Task implementations (scheduled jobs)
- `src/util/` - Utility functions and helpers
- `src/db/` - Database connection and schema
- `src/types/` - TypeScript type definitions
- `drizzle/` - Database migrations
- `config/` - Configuration files (tasks.json, mute_status.txt)
- `logs/` - Application logs (auto-generated)
- `report/` - Task output reports

---

## Important Notes
- This is a Node.js application with ES modules (`"type": "module"` in package.json)
- TypeScript strict mode is enabled - always use proper typing
- The project uses Japanese UI strings but English for code/logic
- Database file is created at `{cwd}/db.sqlite`
- Tasks are dynamically loaded via `import(fileUrl)` with absolute paths
