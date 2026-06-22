/**
 * SqliteEventStore — Persistent event storage using better-sqlite3 with WAL mode.
 *
 * Schema is compatible with db/init.sql (adapted for SQLite: TEXT for dates,
 * TEXT for JSON fields, INTEGER for booleans).
 */

import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { logger } from "../core/logger.js";
import type { SecurityEvent, EventType, Severity } from "../core/types.js";

// ── Row mapper ───────────────────────────────────────────────────

function rowToEvent(row: Record<string, unknown>): SecurityEvent {
  return {
    eventId: row.event_id as string,
    timestamp: new Date(row.timestamp as string),
    cameraId: (row.camera_id as string) ?? null,
    eventType: row.event_type as EventType,
    severity: row.severity as Severity,
    personsInvolved: JSON.parse((row.persons_involved as string) || "[]") as string[],
    description: (row.description as string) ?? "",
    snapshotPath: (row.snapshot_path as string) ?? null,
    audioClipPath: (row.audio_clip_path as string) ?? null,
    payload: JSON.parse((row.payload as string) || "{}") as Record<string, unknown>,
    actionsTaken: JSON.parse((row.actions_taken as string) || "[]") as string[],
    llmSummary: (row.llm_summary as string) ?? null,
    anomalyScore: (row.anomaly_score as number) ?? 0,
    consolidated: (row.consolidated as number) === 1,
  };
}

// ── Store ────────────────────────────────────────────────────────

export class SqliteEventStore {
  private db: Database.Database;
  private insertStmt!: Database.Statement;
  private selectRecentStmt!: Database.Statement;

  constructor(dbPath: string) {
    mkdirSync(dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.initSchema();
    this.prepareStatements();
    logger.info({ dbPath }, "SqliteEventStore opened");
  }

  // ── Schema ──────────────────────────────────────────────────

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS events (
        event_id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        camera_id TEXT,
        event_type TEXT NOT NULL,
        severity INTEGER NOT NULL DEFAULT 0,
        persons_involved TEXT DEFAULT '[]',
        description TEXT DEFAULT '',
        snapshot_path TEXT,
        audio_clip_path TEXT,
        payload TEXT DEFAULT '{}',
        actions_taken TEXT DEFAULT '[]',
        llm_summary TEXT,
        anomaly_score REAL DEFAULT 0.0,
        consolidated INTEGER DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_events_ts ON events(timestamp);
      CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
    `);
  }

  private prepareStatements(): void {
    this.insertStmt = this.db.prepare(`
      INSERT OR REPLACE INTO events (
        event_id, timestamp, camera_id, event_type, severity,
        persons_involved, description, snapshot_path, audio_clip_path,
        payload, actions_taken, llm_summary, anomaly_score, consolidated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    this.selectRecentStmt = this.db.prepare(`
      SELECT * FROM events WHERE timestamp > ? ORDER BY timestamp DESC
    `);
  }

  // ── Public API ──────────────────────────────────────────────

  async insert(event: SecurityEvent): Promise<void> {
    this.insertStmt.run(
      event.eventId,
      event.timestamp.toISOString(),
      event.cameraId,
      event.eventType,
      event.severity,
      JSON.stringify(event.personsInvolved),
      event.description,
      event.snapshotPath,
      event.audioClipPath,
      JSON.stringify(event.payload),
      JSON.stringify(event.actionsTaken),
      event.llmSummary,
      event.anomalyScore,
      event.consolidated ? 1 : 0,
    );
    logger.debug({ eventId: event.eventId, eventType: event.eventType }, "Event stored");
  }

  async getRecent(minutes = 60): Promise<SecurityEvent[]> {
    const cutoff = new Date(Date.now() - minutes * 60_000).toISOString();
    const rows = this.selectRecentStmt.all(cutoff) as Record<string, unknown>[];
    return rows.map(rowToEvent);
  }

  async getByDate(date: Date): Promise<SecurityEvent[]> {
    const dateStr = date.toISOString().slice(0, 10);
    const stmt = this.db.prepare(
      "SELECT * FROM events WHERE timestamp LIKE ? ORDER BY timestamp DESC",
    );
    const rows = stmt.all(`${dateStr}%`) as Record<string, unknown>[];
    return rows.map(rowToEvent);
  }

  async countSoundEvents(soundClass: string, days = 30): Promise<number> {
    const cutoff = new Date(Date.now() - days * 86_400_000).toISOString();
    const stmt = this.db.prepare(`
      SELECT COUNT(*) AS cnt FROM events
      WHERE event_type = 'sound_detected'
        AND timestamp > ?
        AND json_extract(payload, '$.soundClass') = ?
    `);
    const row = stmt.get(cutoff, soundClass) as { cnt: number } | undefined;
    return row?.cnt ?? 0;
  }

  close(): void {
    this.db.close();
    logger.info("SqliteEventStore closed");
  }
}
