/**
 * SceneContextStore — Persistência do contexto de cena por câmera.
 *
 * Cada câmera tem um SceneContext que descreve "o que ela vê",
 * quem são os residentes, veículos conhecidos, zonas de interesse
 * e rotinas associadas. Esse contexto é carregado no boot do agente
 * e injetado no prompt do LLM para dar consciência situacional.
 */

import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { logger } from "../core/logger.js";
import type { SceneContext, SceneContextUpdate } from "../core/types.js";

// ── Default factory ──────────────────────────────────────────────

export function createDefaultSceneContext(
  cameraId: string,
  label?: string,
): SceneContext {
  return {
    cameraId,
    label: label ?? cameraId,
    description: "",
    location: "EXTERNAL",
    environment: {
      timeOfDay: ["day", "night"],
      weather: ["sunny", "cloudy"],
      lighting: "BRIGHT",
    },
    knownResidents: [],
    knownVehicles: [],
    zones: [],
    routines: [],
    lastUpdated: new Date(),
    version: 1,
  };
}

// ── Row mapper ───────────────────────────────────────────────────

function rowToSceneContext(row: Record<string, unknown>): SceneContext {
  return {
    cameraId: row.camera_id as string,
    label: (row.label as string) ?? (row.camera_id as string),
    description: (row.description as string) ?? "",
    location: (row.location as SceneContext["location"]) ?? "EXTERNAL",
    environment: JSON.parse((row.environment as string) || "{}"),
    knownResidents: JSON.parse((row.known_residents as string) || "[]"),
    knownVehicles: JSON.parse((row.known_vehicles as string) || "[]"),
    zones: JSON.parse((row.zones as string) || "[]"),
    routines: JSON.parse((row.routines as string) || "[]"),
    lastUpdated: new Date(row.last_updated as string),
    version: (row.version as number) ?? 1,
  };
}

// ── Store ────────────────────────────────────────────────────────

export class SceneContextStore {
  private db: Database.Database;

  constructor(dbPath: string) {
    mkdirSync(dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.initSchema();
    logger.info({ dbPath }, "SceneContextStore opened");
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS scene_contexts (
        camera_id TEXT PRIMARY KEY,
        label TEXT,
        description TEXT DEFAULT '',
        location TEXT NOT NULL DEFAULT 'EXTERNAL',
        environment TEXT DEFAULT '{}',
        known_residents TEXT DEFAULT '[]',
        known_vehicles TEXT DEFAULT '[]',
        zones TEXT DEFAULT '[]',
        routines TEXT DEFAULT '[]',
        last_updated TEXT NOT NULL,
        version INTEGER DEFAULT 1
      );
    `);
  }

  async get(cameraId: string): Promise<SceneContext | undefined> {
    const stmt = this.db.prepare(
      "SELECT * FROM scene_contexts WHERE camera_id = ?",
    );
    const row = stmt.get(cameraId) as Record<string, unknown> | undefined;
    return row ? rowToSceneContext(row) : undefined;
  }

  async getAll(): Promise<SceneContext[]> {
    const stmt = this.db.prepare("SELECT * FROM scene_contexts");
    const rows = stmt.all() as Record<string, unknown>[];
    return rows.map(rowToSceneContext);
  }

  async save(context: SceneContext): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO scene_contexts (
        camera_id, label, description, location, environment,
        known_residents, known_vehicles, zones, routines,
        last_updated, version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      context.cameraId,
      context.label,
      context.description,
      context.location,
      JSON.stringify(context.environment),
      JSON.stringify(context.knownResidents),
      JSON.stringify(context.knownVehicles),
      JSON.stringify(context.zones),
      JSON.stringify(context.routines),
      context.lastUpdated.toISOString(),
      context.version,
    );
    logger.debug({ cameraId: context.cameraId }, "SceneContext saved");
  }

  async update(
    cameraId: string,
    update: SceneContextUpdate,
  ): Promise<SceneContext | undefined> {
    const existing = await this.get(cameraId);
    if (!existing) return undefined;

    const updated: SceneContext = {
      ...existing,
      ...update,
      lastUpdated: new Date(),
      version: existing.version + 1,
    };
    updated.cameraId = cameraId;

    await this.save(updated);
    return updated;
  }

  async delete(cameraId: string): Promise<void> {
    const stmt = this.db.prepare(
      "DELETE FROM scene_contexts WHERE camera_id = ?",
    );
    stmt.run(cameraId);
    logger.info({ cameraId }, "SceneContext deleted");
  }

  close(): void {
    this.db.close();
    logger.info("SceneContextStore closed");
  }
}
