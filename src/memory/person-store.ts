/**
 * SqlitePersonRegistry — Persistent person registry using better-sqlite3.
 *
 * Stores PersonRecord in the `persons` table and visit logs in `person_sightings`.
 * Schema is compatible with db/init.sql (adapted for SQLite).
 */

import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { logger } from "../core/logger.js";
import { PersonCategory } from "../core/types.js";
import type { PersonRecord } from "../core/types.js";

// ── Row mapper ───────────────────────────────────────────────────

function rowToPerson(row: Record<string, unknown>): PersonRecord {
  return {
    personId: row.person_id as string,
    name: (row.name as string) ?? null,
    category: (row.category as string) as PersonRecord["category"],
    faceEmbeddingCount: (row.face_embedding_count as number) ?? 0,
    voiceEmbeddingCount: (row.voice_embedding_count as number) ?? 0,
    firstSeen: row.first_seen ? new Date(row.first_seen as string) : null,
    lastSeen: row.last_seen ? new Date(row.last_seen as string) : null,
    totalVisits: (row.total_visits as number) ?? 0,
    avgVisitDuration: (row.avg_visit_duration as number) ?? 0,
    commonHours: JSON.parse((row.common_hours as string) || "[]") as number[],
    commonDays: JSON.parse((row.common_days as string) || "[]") as number[],
    commonEntrances: JSON.parse((row.common_entrances as string) || "[]") as string[],
    importance: (row.importance as number) ?? 0.5,
    threatScore: (row.threat_score as number) ?? 0,
    tags: JSON.parse((row.tags as string) || "[]") as string[],
    notes: (row.notes as string) ?? null,
    metadata: JSON.parse((row.metadata as string) || "{}") as Record<string, unknown>,
  };
}

// ── Registry ─────────────────────────────────────────────────────

export class SqlitePersonRegistry {
  private db: Database.Database;

  constructor(dbPath: string) {
    mkdirSync(dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.initSchema();
    logger.info({ dbPath }, "SqlitePersonRegistry opened");
  }

  // ── Schema ──────────────────────────────────────────────────

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS persons (
        person_id TEXT PRIMARY KEY,
        name TEXT,
        category TEXT NOT NULL DEFAULT 'unknown',
        face_embedding_count INTEGER DEFAULT 0,
        voice_embedding_count INTEGER DEFAULT 0,
        first_seen TEXT,
        last_seen TEXT,
        total_visits INTEGER DEFAULT 0,
        avg_visit_duration REAL DEFAULT 0.0,
        common_hours TEXT DEFAULT '[]',
        common_days TEXT DEFAULT '[]',
        common_entrances TEXT DEFAULT '[]',
        importance REAL DEFAULT 0.5,
        threat_score REAL DEFAULT 0.0,
        tags TEXT DEFAULT '[]',
        notes TEXT,
        metadata TEXT DEFAULT '{}'
      );

      CREATE TABLE IF NOT EXISTS person_sightings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        person_id TEXT NOT NULL,
        camera_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        confidence REAL,
        snapshot_path TEXT,
        FOREIGN KEY (person_id) REFERENCES persons(person_id)
      );

      CREATE INDEX IF NOT EXISTS idx_persons_category ON persons(category);
      CREATE INDEX IF NOT EXISTS idx_persons_last_seen ON persons(last_seen);
      CREATE INDEX IF NOT EXISTS idx_persons_name ON persons(name);
      CREATE INDEX IF NOT EXISTS idx_sightings_person ON person_sightings(person_id, timestamp);
      CREATE INDEX IF NOT EXISTS idx_sightings_camera ON person_sightings(camera_id, timestamp);
    `);
  }

  // ── Public API ──────────────────────────────────────────────

  async get(personId: string): Promise<PersonRecord | undefined> {
    const stmt = this.db.prepare("SELECT * FROM persons WHERE person_id = ?");
    const row = stmt.get(personId) as Record<string, unknown> | undefined;
    return row ? rowToPerson(row) : undefined;
  }

  async save(person: PersonRecord): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO persons (
        person_id, name, category, face_embedding_count, voice_embedding_count,
        first_seen, last_seen, total_visits, avg_visit_duration,
        common_hours, common_days, common_entrances,
        importance, threat_score, tags, notes, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      person.personId,
      person.name,
      person.category,
      person.faceEmbeddingCount,
      person.voiceEmbeddingCount,
      person.firstSeen?.toISOString() ?? null,
      person.lastSeen?.toISOString() ?? null,
      person.totalVisits,
      person.avgVisitDuration,
      JSON.stringify(person.commonHours),
      JSON.stringify(person.commonDays),
      JSON.stringify(person.commonEntrances),
      person.importance,
      person.threatScore,
      JSON.stringify(person.tags),
      person.notes,
      JSON.stringify(person.metadata),
    );
    logger.debug({ personId: person.personId }, "Person saved");
  }

  async getByName(name: string): Promise<PersonRecord | undefined> {
    const stmt = this.db.prepare("SELECT * FROM persons WHERE name = ? COLLATE NOCASE");
    const row = stmt.get(name) as Record<string, unknown> | undefined;
    return row ? rowToPerson(row) : undefined;
  }

  async allPersons(): Promise<PersonRecord[]> {
    const stmt = this.db.prepare("SELECT * FROM persons ORDER BY last_seen DESC");
    const rows = stmt.all() as Record<string, unknown>[];
    return rows.map(rowToPerson);
  }

  async registerNew(cameraId?: string): Promise<PersonRecord> {
    const id = `unknown_${crypto.randomUUID().slice(0, 8)}`;
    const person: PersonRecord = {
      personId: id,
      name: null,
      category: PersonCategory.UNKNOWN,
      faceEmbeddingCount: 0,
      voiceEmbeddingCount: 0,
      firstSeen: new Date(),
      lastSeen: new Date(),
      totalVisits: 1,
      avgVisitDuration: 0,
      commonHours: [new Date().getHours()],
      commonDays: [new Date().getDay()],
      commonEntrances: cameraId ? [cameraId] : [],
      importance: 0.5,
      threatScore: 0,
      tags: [],
      notes: null,
      metadata: {},
    };
    await this.save(person);
    logger.info({ personId: id, cameraId }, "New person registered");
    return person;
  }

  async recordVisit(personId: string, cameraId?: string): Promise<void> {
    const person = await this.get(personId);
    if (!person) return;

    person.lastSeen = new Date();
    person.totalVisits++;

    const hour = new Date().getHours();
    if (!person.commonHours.includes(hour)) {
      person.commonHours.push(hour);
    }

    // Promove a FREQUENT_UNKNOWN se >= 5 visitas
    if (person.category === PersonCategory.UNKNOWN && person.totalVisits >= 5) {
      person.category = PersonCategory.FREQUENT_UNKNOWN;
      logger.info({ personId }, "Person promoted to FREQUENT_UNKNOWN");
    }

    await this.save(person);

    // Registra o avistamento
    const sightingStmt = this.db.prepare(`
      INSERT INTO person_sightings (person_id, camera_id, timestamp)
      VALUES (?, ?, ?)
    `);
    sightingStmt.run(personId, cameraId ?? "unknown", new Date().toISOString());
  }

  async markKnown(personId: string, name: string): Promise<void> {
    const person = await this.get(personId);
    if (person) {
      person.name = name;
      person.category = PersonCategory.KNOWN;
      await this.save(person);
      logger.info({ personId, name }, "Person marked as known");
    }
  }

  async markThreat(personId: string, reason = ""): Promise<void> {
    const person = await this.get(personId);
    if (person) {
      person.category = PersonCategory.THREAT;
      person.threatScore = 1;
      person.notes = reason;
      await this.save(person);
      logger.warn({ personId, reason }, "Person marked as threat");
    }
  }

  close(): void {
    this.db.close();
    logger.info("SqlitePersonRegistry closed");
  }
}
