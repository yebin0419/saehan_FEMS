import { memoryStore } from "./memory";
import type { AnalysisStore } from "./types";

/**
 * Phase 2에서는 전부 인메모리. Phase 3+에서 process.env.DATABASE_URL 유무로
 * drizzle 어댑터로 분기하면 된다.
 */
export const store: AnalysisStore = memoryStore;

export type { AnalysisStore } from "./types";
