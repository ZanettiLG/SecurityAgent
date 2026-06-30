/**
 * RoutineStore — Persistência de perfis de rotina (RoutineProfile) em SQLite.
 *
 * Integra-se ao RoutineLearner: toda mutação no perfil (updateProfile)
 * é espelhada no SQLite. No boot, carrega todos os profiles do banco.
 */

import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { logger } from "../core/logger.js";
import type { RoutineProfile } from "./routine_learner.js";

// ── Serialization helpers ────────────────────────────────────────

function profileToRow(profile: RoutineProfile): Record<string, unknown> {
  const typicalEventsObj: Record<
    string,
    Array<{
      signature: string;
      eventType: string;
      description: string;
      frequency: number;
      lastSeen: Date;
    }>
  > = {};
  for (const [hourKey, events] of profile.typicalEvents) {
    typicalEventsObj[hourKey] = events;
  }

  return {
    entity_id: profile.entityId,
    entity_type: profile.entityType,
    hourly_activity: JSON.stringify(profile.hourlyActivity),
    daily_activity: JSON.stringify(profile.dailyActivity),
    typical_events: JSON.stringify(typicalEventsObj),
    total_observations: profile.totalObservations,
    days_of_data: profile.daysOfData,
    last_updated: profile.lastUpdated?.toISOString() ?? null,
  };
}

function rowToProfile(row: Record<string, unknown>): RoutineProfile {
  const typicalEventsRaw = JSON.parse(
    (row.typical_events as string) || "{}",
  ) as Record<string, Array<Record<string, unknown>>>;
  const typicalEvents = new Map<
    string,
    Array<{
      signature: string;
      eventType: string;
      description: string;
      frequency: number;
      lastSeen: Date;
    }>
  >();

  for (const [hourKey, events] of Object.entries(typicalEventsRaw)) {
    typicalEvents.set(
      hourKey,
      events.map((e) => ({
        signature: e.signature as string,
        eventType: e.eventType as string,
        description: e.description as string,
        frequency: e.frequency as number,
        lastSeen: new Date(e.lastSeen as string),
      })),
    );
  }

  return {
    entityId: row.entity_id as string,
    entityType: row.entity_type as RoutineProfile["entityType"],
    hourlyActivity: JSON.parse(
      (row.hourly_activity as string) || new Array(24).fill(0).toString(),
    ),
    dailyActivity: JSON.parse(
      (row.daily_activity as string) || new Array(7).fill(0).toString(),
    ),
    typicalEvents,
    totalObservations: (row.total_observations as number) ?? 0,
    daysOfData: (row.days_of_data as number) ?? 0,
    lastUpdated: row.last_updated ? new Date(row.last_updated as string) : null,
  };
}

// ── Store ────────────────────────────────────────────────────────

export class RoutineStore {
  private db: Database.Database;
  private upsertStmt: Database.Statement;

  constructor(dbPath: string) {
    mkdirSync(dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.initSchema();
    this.upsertStmt = this.db.prepare(`
      INSERT OR REPLACE INTO routine_profiles
        (entity_id, entity_type, hourly_activity, daily_activity,
         typical_events, total_observations, days_of_data, last_updated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    logger.info({ dbPath }, "RoutineStore opened");
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS routine_profiles (
        entity_id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        hourly_activity TEXT NOT NULL DEFAULT '[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]',
        daily_activity TEXT NOT NULL DEFAULT '[0,0,0,0,0,0,0]',
        typical_events TEXT DEFAULT '{}',
        total_observations INTEGER DEFAULT 0,
        days_of_data INTEGER DEFAULT 0,
        last_updated TEXT
      );
    `);
  }

  async loadAll(): Promise<Map<string, RoutineProfile>> {
    const rows = this.db
      .prepare("SELECT * FROM routine_profiles")
      .all() as Record<string, unknown>[];
    const profiles = new Map<string, RoutineProfile>();
    for (const row of rows) {
      profiles.set(row.entity_id as string, rowToProfile(row));
    }
    logger.info({ count: profiles.size }, "Routine profiles loaded");
    return profiles;
  }

  async save(profile: RoutineProfile): Promise<void> {
    const row = profileToRow(profile);
    this.upsertStmt.run(
      row.entity_id,
      row.entity_type,
      row.hourly_activity,
      row.daily_activity,
      row.typical_events,
      row.total_observations,
      row.days_of_data,
      row.last_updated,
    );
  }

  async delete(entityId: string): Promise<void> {
    this.db
      .prepare("DELETE FROM routine_profiles WHERE entity_id = ?")
      .run(entityId);
  }

  close(): void {
    this.db.close();
    logger.info("RoutineStore closed");
  }
}
