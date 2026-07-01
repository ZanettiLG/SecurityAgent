/**
 * ConversationStore — Persistência do histórico de conversas com o usuário em SQLite.
 *
 * O QueryManager mantém um array de conversas em memória que se perde ao reiniciar.
 * Este store persiste perguntas e respostas para que o agente retome
 * o contexto de diálogos anteriores.
 */

import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { logger } from "../core/logger.js";

// ── Types ────────────────────────────────────────────────────────

export interface ConversationEntry {
  id?: number;
  questionId: string;
  text: string;
  answer: string;
  askedAt: Date;
  answeredAt: Date | null;
  priority: string;
  relatedEntities: string[];
  relatedEventId: string | null;
}

// ── Row mapper ───────────────────────────────────────────────────

function rowToEntry(row: Record<string, unknown>): ConversationEntry {
  return {
    id: row.id as number,
    questionId: row.question_id as string,
    text: row.text as string,
    answer: row.answer as string,
    askedAt: new Date(row.asked_at as string),
    answeredAt: row.answered_at ? new Date(row.answered_at as string) : null,
    priority: (row.priority as string) ?? "medium",
    relatedEntities: JSON.parse((row.related_entities as string) || "[]"),
    relatedEventId: (row.related_event_id as string) ?? null,
  };
}

// ── Store ────────────────────────────────────────────────────────

export class ConversationStore {
  private db: Database.Database;

  constructor(dbPath: string) {
    mkdirSync(dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.initSchema();
    logger.info({ dbPath }, "ConversationStore opened");
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS conversation_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question_id TEXT NOT NULL,
        text TEXT NOT NULL,
        answer TEXT NOT NULL,
        asked_at TEXT NOT NULL,
        answered_at TEXT,
        priority TEXT DEFAULT 'medium',
        related_entities TEXT DEFAULT '[]',
        related_event_id TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_conv_ts ON conversation_history(asked_at DESC);
    `);
  }

  async getRecent(limit = 20): Promise<ConversationEntry[]> {
    const rows = this.db
      .prepare(
        "SELECT * FROM conversation_history ORDER BY asked_at DESC LIMIT ?",
      )
      .all(limit) as Record<string, unknown>[];
    return rows.map(rowToEntry);
  }

  async getByQuestionId(
    questionId: string,
  ): Promise<ConversationEntry | undefined> {
    const row = this.db
      .prepare("SELECT * FROM conversation_history WHERE question_id = ?")
      .get(questionId) as Record<string, unknown> | undefined;
    return row ? rowToEntry(row) : undefined;
  }

  async insert(entry: Omit<ConversationEntry, "id">): Promise<void> {
    this.db
      .prepare(
        `
      INSERT INTO conversation_history
        (question_id, text, answer, asked_at, answered_at, priority, related_entities, related_event_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      )
      .run(
        entry.questionId,
        entry.text,
        entry.answer,
        entry.askedAt.toISOString(),
        entry.answeredAt?.toISOString() ?? null,
        entry.priority,
        JSON.stringify(entry.relatedEntities),
        entry.relatedEventId,
      );
  }

  async updateAnswer(questionId: string, answer: string): Promise<void> {
    this.db
      .prepare(
        "UPDATE conversation_history SET answer = ?, answered_at = ? WHERE question_id = ?",
      )
      .run(answer, new Date().toISOString(), questionId);
  }

  async count(): Promise<number> {
    const row = this.db
      .prepare("SELECT COUNT(*) as cnt FROM conversation_history")
      .get() as { cnt: number };
    return row.cnt;
  }

  close(): void {
    this.db.close();
    logger.info("ConversationStore closed");
  }
}
