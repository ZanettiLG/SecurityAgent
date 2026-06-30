/**
 * HypothesisStore — Persistência de hipóteses em SQLite.
 *
 * O HypothesisEngine gera hipóteses sobre eventos anômalos.
 * Com este store, as hipóteses sobrevivem a reinícios e podem
 * ser revisitadas em sessões futuras.
 */

import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { logger } from "../core/logger.js";
import type { Hypothesis, HypothesisStatus } from "../reasoning/hypothesis.js";

// ── Row mapper ───────────────────────────────────────────────────

function rowToHypothesis(row: Record<string, unknown>): Hypothesis {
  return {
    hypothesisId: row.hypothesis_id as string,
    title: row.title as string,
    description: (row.description as string) ?? "",
    probability: (row.probability as number) ?? 0.5,
    status: row.status as HypothesisStatus,
    supportingEvidence: JSON.parse((row.supporting_evidence as string) || "[]"),
    contradictingEvidence: JSON.parse(
      (row.contradicting_evidence as string) || "[]",
    ),
    relatedEntities: JSON.parse((row.related_entities as string) || "[]"),
    createdAt: new Date(row.created_at as string),
    testedAt: row.tested_at ? new Date(row.tested_at as string) : null,
    resolvedAt: row.resolved_at ? new Date(row.resolved_at as string) : null,
    userFeedback: (row.user_feedback as string) ?? null,
  };
}

// ── Store ────────────────────────────────────────────────────────

export class HypothesisStore {
  private db: Database.Database;

  constructor(dbPath: string) {
    mkdirSync(dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.initSchema();
    logger.info({ dbPath }, "HypothesisStore opened");
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS hypotheses (
        hypothesis_id TEXT PRIMARY KEY,
        title TEXT NOT NULL DEFAULT '',
        description TEXT DEFAULT '',
        probability REAL DEFAULT 0.5,
        status TEXT NOT NULL DEFAULT 'draft',
        supporting_evidence TEXT DEFAULT '[]',
        contradicting_evidence TEXT DEFAULT '[]',
        related_entities TEXT DEFAULT '[]',
        created_at TEXT NOT NULL,
        tested_at TEXT,
        resolved_at TEXT,
        user_feedback TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_hypotheses_status ON hypotheses(status);
      CREATE INDEX IF NOT EXISTS idx_hypotheses_created ON hypotheses(created_at);
    `);
  }

  async getAll(): Promise<Hypothesis[]> {
    const rows = this.db
      .prepare("SELECT * FROM hypotheses ORDER BY created_at DESC")
      .all() as Record<string, unknown>[];
    return rows.map(rowToHypothesis);
  }

  async getActive(): Promise<Hypothesis[]> {
    const rows = this.db
      .prepare(
        "SELECT * FROM hypotheses WHERE status NOT IN ('user_confirmed', 'user_rejected', 'rejected') ORDER BY probability DESC",
      )
      .all() as Record<string, unknown>[];
    return rows.map(rowToHypothesis);
  }

  async get(hypothesisId: string): Promise<Hypothesis | undefined> {
    const row = this.db
      .prepare("SELECT * FROM hypotheses WHERE hypothesis_id = ?")
      .get(hypothesisId) as Record<string, unknown> | undefined;
    return row ? rowToHypothesis(row) : undefined;
  }

  async save(hypothesis: Hypothesis): Promise<void> {
    this.db
      .prepare(
        `
      INSERT OR REPLACE INTO hypotheses
        (hypothesis_id, title, description, probability, status,
         supporting_evidence, contradicting_evidence, related_entities,
         created_at, tested_at, resolved_at, user_feedback)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      )
      .run(
        hypothesis.hypothesisId,
        hypothesis.title,
        hypothesis.description,
        hypothesis.probability,
        hypothesis.status,
        JSON.stringify(hypothesis.supportingEvidence),
        JSON.stringify(hypothesis.contradictingEvidence),
        JSON.stringify(hypothesis.relatedEntities),
        hypothesis.createdAt.toISOString(),
        hypothesis.testedAt?.toISOString() ?? null,
        hypothesis.resolvedAt?.toISOString() ?? null,
        hypothesis.userFeedback,
      );
  }

  async delete(hypothesisId: string): Promise<void> {
    this.db
      .prepare("DELETE FROM hypotheses WHERE hypothesis_id = ?")
      .run(hypothesisId);
  }

  close(): void {
    this.db.close();
    logger.info("HypothesisStore closed");
  }
}
