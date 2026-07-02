/**
 * Scene Index — Persistência e busca semântica de observações de cena.
 *
 * Armazena SceneObservation em:
 * - SQLite: metadados completos (narration, persons, vehicles, objects)
 * - ChromaDB: text embedding da narração para busca semântica
 *
 * Quando ChromaDB está offline, usa InMemoryVectorStore como fallback.
 */

import { randomUUID } from "node:crypto";
import Database from "better-sqlite3";
import { logger } from "../core/logger.js";
import type { VectorStore } from "./system.js";
import { type SceneObservation, type SceneDescription } from "../core/types.js";

// ── Interfaces ──────────────────────────────────────────────────

export interface SemanticQuery {
  text?: string;
  personId?: string;
  dateRange?: [Date, Date];
  cameraId?: string;
  topK?: number;
}

export interface SemanticResult {
  observation: SceneObservation;
  score: number;
  matchedBy: ("text" | "metadata")[];
  highlights: string[];
}

// ── SceneIndex ──────────────────────────────────────────────────

export class SceneIndex {
  private db: Database.Database;
  private initialized = false;

  constructor(
    private dataDir: string,
    private vectorStore: VectorStore,
  ) {
    this.db = new Database(`${dataDir}/scene_index.db`);
  }

  /** Cria tabelas e índices se não existirem */
  async initialize(): Promise<void> {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS scene_observations (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        camera_id TEXT NOT NULL,
        snapshot_path TEXT,
        narration TEXT NOT NULL,
        anomaly_flags TEXT,
        persons_json TEXT,
        vehicles_json TEXT,
        objects_json TEXT,
        actions_json TEXT,
        intentions_json TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_scene_camera ON scene_observations(camera_id, timestamp);
      CREATE INDEX IF NOT EXISTS idx_scene_timestamp ON scene_observations(timestamp);
    `);
    this.initialized = true;
    logger.info("SceneIndex initialized");
  }

  /** Persiste uma observação em SQLite + ChromaDB (embedding) */
  async store(observation: SceneObservation): Promise<void> {
    if (!this.initialized) await this.initialize();

    const d = observation.description;

    // SQLite: metadados completos
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO scene_observations
        (id, timestamp, camera_id, snapshot_path, narration,
         anomaly_flags, persons_json, vehicles_json, objects_json,
         actions_json, intentions_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      observation.id,
      observation.timestamp.toISOString(),
      observation.cameraId,
      observation.snapshotPath,
      d.narration,
      JSON.stringify(d.anomalyFlags),
      JSON.stringify(d.persons),
      JSON.stringify(d.vehicles),
      JSON.stringify(d.objects),
      JSON.stringify(d.actions),
      JSON.stringify(d.intentions),
    );

    // ChromaDB: text embedding da narração
    try {
      const embedding = observation.textEmbedding;
      if (embedding && embedding.length > 0) {
        await this.vectorStore.insert(
          "scene_observations",
          observation.id,
          embedding,
          {
            cameraId: observation.cameraId,
            timestamp: observation.timestamp.toISOString(),
            narration: d.narration.slice(0, 200),
          },
        );
      }
    } catch (err) {
      logger.warn(
        { err },
        "SceneIndex: failed to store embedding (ChromaDB may be offline)",
      );
    }
  }

  /** Busca semântica cross-modal */
  async search(query: SemanticQuery): Promise<SemanticResult[]> {
    if (!this.initialized) await this.initialize();

    const { text, cameraId, topK = 5 } = query;
    const results: SemanticResult[] = [];

    // Busca por texto (full-text search no SQLite)
    if (text) {
      const sql = cameraId
        ? `SELECT * FROM scene_observations WHERE camera_id = ? AND narration LIKE ? ORDER BY timestamp DESC LIMIT ?`
        : `SELECT * FROM scene_observations WHERE narration LIKE ? ORDER BY timestamp DESC LIMIT ?`;

      const params = cameraId
        ? [cameraId, `%${text}%`, topK]
        : [`%${text}%`, topK];

      const rows = this.db.prepare(sql).all(...params) as Array<
        Record<string, unknown>
      >;

      for (const row of rows) {
        results.push({
          observation: this.rowToObservation(row),
          score: 0.7,
          matchedBy: ["metadata"],
          highlights: [text],
        });
      }
    } else if (cameraId) {
      // Sem texto, busca por câmera
      const rows = this.db
        .prepare(
          `SELECT * FROM scene_observations WHERE camera_id = ? ORDER BY timestamp DESC LIMIT ?`,
        )
        .all(cameraId, topK) as Array<Record<string, unknown>>;

      for (const row of rows) {
        results.push({
          observation: this.rowToObservation(row),
          score: 0.5,
          matchedBy: ["metadata"],
          highlights: [],
        });
      }
    }

    // Busca vetorial (ChromaDB) — se houver texto e embedding disponível
    if (text && this.vectorStore) {
      try {
        // Usa um embedding dummy (zero vector) para busca — o ideal
        // seria gerar embedding real da query, mas isso requer API call.
        // Para MVP, usamos full-text search do SQLite que é suficiente.
        const vecResults = await this.vectorStore.search(
          "scene_observations",
          new Array(384).fill(0), // dummy embedding — será substituído por embed real
          topK,
        );

        for (const vr of vecResults) {
          // Evita duplicatas com resultados SQLite
          if (!results.some((r) => r.observation.id === vr.id)) {
            const row = this.db
              .prepare(`SELECT * FROM scene_observations WHERE id = ?`)
              .get(vr.id) as Record<string, unknown> | undefined;
            if (row) {
              results.push({
                observation: this.rowToObservation(row),
                score: vr.score,
                matchedBy: ["text"],
                highlights: [text],
              });
            }
          }
        }
      } catch {
        // ChromaDB offline — ignora
      }
    }

    return results.slice(0, topK);
  }

  /** Últimas N observações (opcionalmente filtradas por câmera) */
  async getRecent(cameraId?: string, limit = 20): Promise<SceneObservation[]> {
    if (!this.initialized) await this.initialize();

    const sql = cameraId
      ? `SELECT * FROM scene_observations WHERE camera_id = ? ORDER BY timestamp DESC LIMIT ?`
      : `SELECT * FROM scene_observations ORDER BY timestamp DESC LIMIT ?`;

    const params = cameraId ? [cameraId, limit] : [limit];
    const rows = this.db.prepare(sql).all(...params) as Array<
      Record<string, unknown>
    >;

    return rows.map((r) => this.rowToObservation(r));
  }

  /** Contagem de observações armazenadas */
  get count(): number {
    const row = this.db
      .prepare(`SELECT COUNT(*) as cnt FROM scene_observations`)
      .get() as { cnt: number } | undefined;
    return row?.cnt ?? 0;
  }

  /** Fecha a conexão SQLite */
  async close(): Promise<void> {
    this.db.close();
  }

  // ── Helpers ──────────────────────────────────────────────────

  private rowToObservation(row: Record<string, unknown>): SceneObservation {
    const parseJson = (val: unknown, fallback: unknown[] = []): unknown[] => {
      if (typeof val === "string") {
        try {
          return JSON.parse(val);
        } catch {
          return fallback;
        }
      }
      return fallback;
    };

    const description: SceneDescription = {
      narration: String(row.narration ?? ""),
      persons: parseJson(row.persons_json, []) as SceneDescription["persons"],
      vehicles: parseJson(
        row.vehicles_json,
        [],
      ) as SceneDescription["vehicles"],
      objects: parseJson(row.objects_json, []) as SceneDescription["objects"],
      actions: parseJson(row.actions_json, []) as string[],
      intentions: parseJson(row.intentions_json, []) as string[],
      anomalyFlags: parseJson(row.anomaly_flags, []) as string[],
    };

    return {
      id: String(row.id ?? randomUUID()),
      timestamp: new Date(String(row.timestamp ?? Date.now())),
      cameraId: String(row.camera_id ?? ""),
      snapshotPath: String(row.snapshot_path ?? ""),
      description,
    };
  }
}
